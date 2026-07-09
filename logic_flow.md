# Flow of the System

This md file will be the master plan and blueprint on how the system should work.

### Architecture

The system is divided into 2 Node structure:

- Client (Laptop A): Holds the frontend website.
- Server (Laptop B): Holds the physical storage (certain directory in D drive), database postgresql and locally installed AI for AI features.

Both laptops are connected either through LAN or wireless to allow both to communicate.

### Roles

There are 5 roles within the system, each role has their own permissions:

- Administrator: Can do almost everything within the system.
- Coordinator: Can do almost everything within the system but requires Administrator permission to do so.
- Officer: Approver of the documents. Can approve, unapprove, reject, request, view, and download.
- Director: Publisher of the documents, Can publish, unpublish, request, view and download.
- Member: End users. Can only request, view and download.

### Department Workflow

- Adding department is easy, nothing much to say here.

### Users Workflow

- Creating users is pretty much self explanatory. Administrator fills out the add user form. Temporary password can be set, altho when left untouch, it will default to the university id. Once created, the newly created user's status will be set by default as `PENDING_PASSWORD`.

- This creation of user will also create another insert on the user related tables like user_credentials and user_settings alongside it as they all are connected.

- This will create an audit log, specifically stating the event. It will also notify the user via their corresponding email associated into their accounts, this email will list their login credentials and temporary password.

- The user can now enter this credentials into the system. Once login, they are forced to complete an onboarding pipeline. First off is by changing their temporary password to actual password. Once set, their status is now set to `PENDING_SSO`. This means they are needed to verify and put their email for the multi-factor authentication added by the system via the Google Auth. Once this is set, their status is now set as `VERIFIED`, which means they can now do what they're allowed to in the system.

- User may change their settings and credentials but not their information set by the Administrator or Coordinators themselves.

- If the Administrator or Coordinator found suspicious activity or malicious act done by a user, they can suspend the user, marking their status as `SUSPENDED`, meaning they can no longer access the system unless otherwise unsuspend.

List of statuses for users

- PENDING_PASSWORD: Immediate password reset
- PENDING_SSO: Immediate google auth confirmation for mfa
- VERIFIED: allows the user to login to the system
- SUSPENDED: disallows the user to login to the system

### Document Worflow

- Only Administrator and Coordinator may upload and create a document, be it a folder or a file. Once they upload or create a document, its status is flagged as `UPLOADED`. This states that the document is, well, uploaded and not shared.

- It then get puts into the server storage (a dedicated directory) with its filename obfuscated with its corresponding uuid. This will also be diagnose by the locally installed AI by summarizing the content of it, the summarized content will be put into the summary column of the database. It also get its content extracted as embedding for the semantic search.

- Alongside the insertion of documents, this will also create an insert to the document_versions. Basically, whenever a file is uploaded, it always create its first version of that detail. This also will be run by ai to look for any changes and put it in the changes_summary column of the version. Folders do not get versions.

- they can revert to a selected version on the inspector's version tab.

- If an existing document gets uploaded twice, a prompt must pop stating that a document already exist in the document and must choose an option before continouing the process.

Replace: The corresponding file will create another version and set its version number correspondingly.
Continue: Continue the upload, but add a suffix like (1) so no two files have the same name.
Skip: Skip the file entirely.

- Since the document, on create/upload have its flagged as `UPLOADED`, no other roles except Administrator and Coordinator may see.

- The Administrator and Coordinator can do the following:

File:
_ can view (view the preview of the content)
_ can download (download it as zip)
_ can edit (rename the filename, or edit the comment and share settings)
Folder:
_ can open (since we cannot view a folder)
_ can download (download it as zip)
_ can edit (rename the filename, or edit the comment and share settings)
Both (Major action events):
_ Share/Unshare (share the folder via department scope and change its status to `PENDING_APPROVAL` or simply unshare it to change the document status back to `UPLOADED`)
_ Archive/Unarchive (Change the status of the document to `ARCHIVED` or `UPLOADED`) \* Delete (Permanently delete the document, along with its content and versions in the database)

They cannot archive a document if it is shared, they first must unshare before doing so.

Delete only appears once the documented is archived.

- Folders act like another view for the table, like you can open a folder and view its content. With breadcrumbs on the Topbar acting as your navigation URL.

- Once shared to departments (documents can be shared to multiple departments), its status is changed to `PENDING_APPROVAL`. This allows the pipeline managers to see the shared file but only within and past their corresponding role.

- Officers and Directors have this nifty trick that, as long as a document is shared to a department that also corresponds to their department, they are 1 flag away from seeing it. This is done so we do not need to manually put their id to the recipient.

- Officers will only be able to see the document if the status is flagged as `PENDING_APPROVAL` and past it (meaning they still can see the document after its status is changed unless it is `UPLOADED` or `ARCHIVED`).

- The officer can do the following to the document shared to their department:

File:
_ can view (view the preview of the content)
_ can download (download it as zip)
Folder:
_ can open (since we cannot view a folder)
_ can download (download it as zip)
Both (Major action events):
_ Approve/Unapprove (Change the status of the document to `APPROVED` or `PENDING_APPROVAL`)
_ Reject (Change the status of the document to `UPLOADED` and set the versions reject columns the rejecting officer and the rejection reason)

They can still unapprove once the status of the document reaches `APPROVED`, this will only be unavailable once the Director publishes it.

They cannot reject an approved document. They must first unapprove before doing so.

- Director will only be able to see the document if the status is flagged as `APPROVED` and past it (meaning they still can see the document after its status is changed unless it is `UPLOADED` or `ARCHIVED`).

- The director can do the following to the document shared to their department:

File:
_ can view (view the preview of the content)
_ can download (download it as zip)
Folder:
_ can open (since we cannot view a folder)
_ can download (download it as zip)
Both (Major action events):
\_ Publish/Unpublish (Change the status of the document to `PUBLISHED` or `APPROVED`)

Publish in this case works similar to Share ability of the Administrator, but instead of per department they share this through the members of their corresponding departments.

In the database, a null recipient_id means everyone in the departments will see this. If it has a value, it means specific users onyl sees this.

Basically if the administrator shares per departments, director shares (or publish) per users

- members can only see the document if the status of the document is `PUBLISHED` and is shared to them specifically or through all via the recipient_id null.

- members are only allowed to view, open, and download a document

- Any major events that changes the status of a folder with content, will cascade through that content. If you have a folder named `capstone` and it has a file named `capstone_reviewer.pdf` and another folder called `project` with content of `system_design.exe`, if you try and share, delete, approve, or any major action event, it will cascade through all the contents and will be audited accordingly

Status of the Documents

- UPLOADED: Locally in the system, not shared
- PENDING_APPROVAL: Waiting for the Officer's Approval
- APPROVED: Approved and awaiting for the Director's Publication
- PUBLISHED: Published and ready to be viewed by the Members
- ARCHIVED: No longer available to be seen by anyone except the Administrator and Coordinator.

### Document Request Worflow

- unlike the document pipeline, this is different. A document can be shared via department or via document request.

- any non admin and non coordinator can request a document. All they have to do is to request a ticket for this.

- the document request system works like a chatbox for ticketing. The admin and coordinators sees the incoming request and can choose to comply and resolve by sending and chatting over to the requesting user or simply deny the request.

- this will bypass the document workflow where document is shared via scope. This however is a straight peer to peer connection sharing. Only the admin/coordinator and the requesting party can see the attached file.

- i dont know how will this be achieved, but the idea is. If the requesting party wants a file that already been sent to, say, other department that is not theirs, the admin/coordinator can deny or share them the documents. In the database, we do not allow both department id and ticket id to live within the same row, so im not sure how will we handle this. Also the `ATTACHMENT` flag on the status must be get rid as this will interfere with the document pipeline.

- For example, in the document_shares, initially it has a XOR constraint. Either you have a department_id or the ticket_id. The problem with this, is if you want to attach the file in a document requests, what would happen? Do we just create another row with the same document_id but this time no department_id? For me it is still a conflict and must be resolve.

### Coordinator Workflow

- The coordinator workflow is like always needing a verification before entering. This will be a headache sooner or later so we need to steel the foundation for this.

- Adding user, adding departments, sharing, deleting, etc etc (any major action events) requires admin approval. Basically whenever a coordinator tries to do a these actions, they will be prompt to "It will be push in the coordinator request, wait for the admin to verify" and has 2 options like Confirm or Cancel.

- For chats however this is different. They can send message instantly without ever getting the admin permission prompt. But they are required when trying to attach a file in the chats.

- audits on this happens only after the admin approve of the action.

### Notification

- Everytime a user does a major change on the system, the other affected party gets notified, simple as that.

### Audit Logs

- Any major action even must be logged, alongside any other major events happen in the system must be logged.

### Others

- obviously this is still missing some functionalities so we need to deep dive on open questions
