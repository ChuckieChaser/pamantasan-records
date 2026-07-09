bunch of errors

DEPARTMENTS

- adding new department causes this error

departments.js:7  POST http://192.168.1.16:5000/api/departments 400 (Bad Request)

- editting a department only changes the department name, the code is stuck and does not change upon edit confirmation

USERS

- creating a user then trying to login fails, saying invalid credentials despite literally the same credentials on the user_credentials password_hash

- since i havent gotten in, I assume that there is no onboarding pipeline up and working like forcing a new password reset, hashing it, and adding the google authentication on pending_sso right? (pending_sso - add a skip button since we still dont have any google auth api)

- trying to login as a suspended user errors as invalid rather than saying about you are suspended whatever

- login University ID field - strictly limit it to the size of the university id and auto add the dash

- editing any field on the user does not get reflected, similar to the code on departments not being able to change on edit confirmation

DOCUMENTS

- constant screaming of the following:

dashboard

documents.js:30 
 GET http://192.168.x.x:5000/api/documents/requests 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:30 
 GET http://192.168.x.x:5000/api/documents/requests 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error) 

management

documents.js:30 
 GET http://192.168.x.x:5000/api/documents/requests 500 (Internal Server Error)
documents.js:30 
 GET http://192.168.x.x:5000/api/documents/requests 500 (Internal Server Error)

documents

documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)

archives

documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
documents.js:5 
 GET http://192.168.x.x:5000/api/documents 500 (Internal Server Error)

- creating a folder errors

documents.js:8 
 POST http://192.168.x.x:5000/api/documents 500 (Internal Server Error)

- uploading documents error

documents.js:8 
 POST http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
UploadDocumentsModal.jsx:202 Failed to upload asd TypeError: Cannot read properties of null (reading 'id')
    at startUploads (UploadDocumentsModal.jsx:176:40)
documents.js:8 
 POST http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
UploadDocumentsModal.jsx:202 Failed to upload asdasd TypeError: Cannot read properties of null (reading 'id')
    at startUploads (UploadDocumentsModal.jsx:176:40)
documents.js:8 
 POST http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
UploadDocumentsModal.jsx:202 Failed to upload asdasd.txt TypeError: Cannot read properties of null (reading 'id')
    at startUploads (UploadDocumentsModal.jsx:184:37)
documents.js:8 
 POST http://192.168.x.x:5000/api/documents 500 (Internal Server Error)
UploadDocumentsModal.jsx:202 Failed to upload jasdad.txt TypeError: Cannot read properties of null (reading 'id')
    at startUploads (UploadDocumentsModal.jsx:184:37)

You told me everything is up and running, yet these bugs still exists and not yet fixed