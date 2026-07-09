some minor issues

> major event cascade dont immediately updates

> for example, sharing a folder with content makes it so it is shared right? After sharing, going into the folder to look at the content, they dont have share BUT if you reload the page, their there. Similarly when trying to approve, publish, etc etc, basically any major events dont get refreshed immeidately

> Officer cannot approve

documents.js:26 
 PATCH http://192.168.1.16:5000/api/documents/shares/678091e7-e6ab-47dd-aee1-40b2274a946a 500 (Internal Server Error)
Inspector.jsx:334 Failed to perform action Error: current transaction is aborted, commands ignored until end of transaction block
    at axios.js:38:31
    at async useShare.js:42:38
    at async utilities.js:9:26
    at async handleDestructiveSubmit (Inspector.jsx:318:28)

> selecting and deselecting a file has a delay, this prolly due to the ms, simply lower it down to respectable amount, Double clicking a document must be quick anyways

> Rejecting doesnt happen? Like... trying to reject just pop right back to shared, also the shared display must correctly display as REJECTED rather than SHARED. Once rejected, remove access to the rejector, no more rejector can still see stuff

> Unapproving also comes with error

documents.js:26 
 PATCH http://192.168.1.16:5000/api/documents/shares/133b9d29-51dc-4801-b2e6-3fc5d44d81b0 500 (Internal Server Error)
Inspector.jsx:334 Failed to perform action Error: current transaction is aborted, commands ignored until end of transaction block
    at axios.js:38:31
    at async useShare.js:42:38
    at async utilities.js:9:26
    at async handleDestructiveSubmit (Inspector.jsx:318:28)
﻿

> There seems to be a hidden modal pop up on the back on every modal events?

> Publishing kind of, weird? Right now, when you publish to a specific person, say person a, you shared him a fodler with content. Once you do share it to specific, the share happens, he can see the folder with content. The problem here the content, the parent folder that is shared is shared only to him, but the content is shared to everyone else? We need to fix that

> Speaking of, director can no longer reject the approved document. So instead it is change by a differnt action, Stash. It basically stash the document so it wont bring up in the pending publication.

> And again, in the admin, unsharing an already shared parent doesnt cascade the unshare for the children as well (prolly due to publication or whatever not sure. Fix)

