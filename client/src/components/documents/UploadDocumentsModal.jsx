import { useState, useRef } from 'react';
import { UploadCloud, FileText, Folder, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuthentication, useDocument, useDocumentVersion } from '../../stores';
import { Modal, PrimaryButton, SecondaryButton, DestructiveButton, ConfirmActionModal } from '../ui';
import { DOCUMENTS_STATUS } from '../../constants';

// Recursive helper to read FileSystemEntry (drag and drop)
const readEntry = async (entry, currentPath = '') => {
    if (entry.isFile) {
        return new Promise((resolve) => {
            entry.file((file) => {
                resolve([{ file, path: currentPath, isFolder: false, name: file.name }]);
            });
        });
    } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        return new Promise((resolve) => {
            dirReader.readEntries(async (entries) => {
                let results = [{ isFolder: true, name: entry.name, path: currentPath, file: null }];
                const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
                
                for (const child of entries) {
                    const childResults = await readEntry(child, newPath);
                    results = results.concat(childResults);
                }
                resolve(results);
            });
        });
    }
    return [];
};

export default function UploadDocumentsModal({ isOpen, onClose, currentFolderId }) {
    const { user } = useAuthentication();
    const { create: createDocument } = useDocument();
    const { create: createDocumentVersion } = useDocumentVersion();
    
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [conflictState, setConflictState] = useState(null); // { item, existingDoc }
    const { documents } = useDocument();
    
    const fileInputRef = useRef(null);
    const folderMapRef = useRef(new Map());

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const items = e.dataTransfer.items;
        if (!items) return;

        let allFiles = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.webkitGetAsEntry) {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    const results = await readEntry(entry);
                    allFiles = allFiles.concat(results);
                }
            } else if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    allFiles.push({ file, path: '', isFolder: false, name: file.name });
                }
            }
        }
        
        // initialize queue state
        const initialQueue = allFiles.map((f, index) => ({
            id: index,
            ...f,
            status: 'PENDING' // PENDING, UPLOADING, SUCCESS, ERROR
        }));
        setUploadQueue(prev => [...prev, ...initialQueue]);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        const newQueue = files.map((file, index) => ({
            id: Date.now() + index,
            file,
            path: '',
            isFolder: false,
            name: file.name,
            status: 'PENDING'
        }));
        setUploadQueue(prev => [...prev, ...newQueue]);
        
        // Reset file input so same files can be re-selected if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startUploads = async () => {
        if (uploadQueue.length === 0) return;
        setIsUploading(true);

        if (folderMapRef.current.size === 0) {
            folderMapRef.current.set('', currentFolderId || null);
        }

        // Sort queue so folders are created first, top-level down
        const sortedQueue = [...uploadQueue].sort((a, b) => {
            const depthA = (a.path.match(/\//g) || []).length;
            const depthB = (b.path.match(/\//g) || []).length;
            if (depthA !== depthB) return depthA - depthB;
            if (a.isFolder === b.isFolder) return 0;
            return a.isFolder ? -1 : 1; // folders before files at same depth
        });

        let hasError = false;

        for (const item of sortedQueue) {
            if (item.status !== 'PENDING') continue;

            const parentId = folderMapRef.current.get(item.path);

            // Check for conflict
            if (!item.conflictResolution) {
                const existingDoc = documents.find(d => 
                    (d.parent_id === parentId || (!d.parent_id && !parentId)) && 
                    d.name === item.name && 
                    d.is_folder === item.isFolder
                );
                
                if (existingDoc) {
                    setIsUploading(false);
                    setConflictState({ item, existingDoc });
                    return; // Pause processing
                }
            }

            if (item.conflictResolution === 'SKIP') {
                setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'SKIPPED' } : q));
                continue;
            }

            setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'UPLOADING' } : q));
            
            try {
                let docId;
                let finalName = item.name;

                if (item.conflictResolution === 'REPLACE') {
                    // Use existing document ID, do NOT create a new document
                    docId = item.existingDocId;
                } else {
                    if (item.conflictResolution === 'UPLOAD_ANYWAY') {
                        // Modify name
                        const extMatch = item.name.match(/\.[0-9a-z]+$/i);
                        if (extMatch && !item.isFolder) {
                            finalName = item.name.replace(extMatch[0], ` (1)${extMatch[0]}`);
                        } else {
                            finalName = `${item.name} (1)`;
                        }
                    }

                    if (item.isFolder) {
                        const folder = await createDocument({
                            name: finalName,
                            is_folder: true,
                            parent_id: parentId,
                            uploader_id: user.id,
                            status: DOCUMENTS_STATUS.UPLOADED,
                        });
                        docId = folder.id;
                        
                        await createDocumentVersion({
                            document_id: docId,
                            uploader_id: user.id,
                            version: 1,
                            path: 'Virtual Folder',
                            size_bytes: 0,
                            mime_type: 'folder',
                            change_summary: 'Created folder',
                        });
                    } else {
                        const doc = await createDocument({
                            name: finalName,
                            is_folder: false,
                            parent_id: parentId,
                            uploader_id: user.id,
                            status: DOCUMENTS_STATUS.UPLOADED,
                        });
                        docId = doc.id;
                    }
                }

                if (!item.isFolder) {
                    const formData = new FormData();
                    formData.append('file', item.file);
                    await createDocumentVersion(docId, formData);
                }

                if (item.isFolder) {
                    const thisFolderPath = item.path ? `${item.path}/${item.name}` : item.name;
                    folderMapRef.current.set(thisFolderPath, docId);
                }

                setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'SUCCESS' } : q));
            } catch (error) {
                console.error(`Failed to upload ${item.name}`, error);
                hasError = true;
                setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'ERROR' } : q));
            }
        }
        
        setIsUploading(false);
        folderMapRef.current = new Map(); // Reset
        if (!hasError) {
            handleClose();
        }
    };

    const handleClose = () => {
        if (isUploading) return;
        setUploadQueue([]);
        folderMapRef.current = new Map();
        onClose();
    };
    
    const removePending = (id) => {
        setUploadQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'SKIPPED' } : q));
    };

    const handleConflictResolution = (resolution) => {
        if (!conflictState) return;
        setUploadQueue(prev => prev.map(q => 
            q.id === conflictState.item.id 
                ? { ...q, conflictResolution: resolution, existingDocId: conflictState.existingDoc.id } 
                : q
        ));
        setConflictState(null);
        setTimeout(startUploads, 0); // Resume
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Upload Files & Folders" className="w-full max-w-2xl h-[85vh] flex flex-col">
            <div className="flex flex-col flex-1 p-6 gap-6 overflow-hidden">
                
                {/* Drag and drop zone */}
                <div
                    className={`${uploadQueue.length === 0 ? 'flex-1 p-8' : 'shrink-0 p-6'} flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors ${
                        isDragging ? 'border-accent bg-accent/5' : 'border-border bg-surface-hover hover:border-accent/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <UploadCloud className={`size-12 mb-4 ${isDragging ? 'text-accent' : 'text-muted'}`} />
                    <p className="text-sm font-bold text-main mb-1">Drag and drop files or folders here</p>
                    <p className="text-xs text-muted mb-4 text-center max-w-sm">Folders will be automatically recreated to preserve their hierarchy.</p>
                    
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileInput}
                    />
                    <SecondaryButton onClick={() => fileInputRef.current?.click()}>
                        Browse Files
                    </SecondaryButton>
                </div>

                {/* Queue list */}
                {uploadQueue.length > 0 && (
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-main">Upload Queue ({uploadQueue.length})</h3>
                            {!isUploading && (
                                <button className="text-xs text-muted hover:text-accent font-medium transition-colors" onClick={() => setUploadQueue([])}>
                                    Clear all
                                </button>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-surface">
                            <ul className="divide-y divide-border">
                                {uploadQueue.map(item => (
                                    <li key={item.id} className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {item.isFolder ? <Folder className="size-4 text-muted shrink-0" /> : <FileText className="size-4 text-muted shrink-0" />}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium text-main truncate">
                                                    {item.path ? `${item.path}/${item.name}` : item.name}
                                                </span>
                                                {item.file && <span className="text-xs text-muted">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center shrink-0 ml-4">
                                            {item.status === 'PENDING' && !isUploading && (
                                                <button onClick={() => removePending(item.id)} className="text-muted hover:text-destructive transition-colors">
                                                    <XCircle className="size-4" />
                                                </button>
                                            )}
                                            {item.status === 'UPLOADING' && <Loader2 className="size-4 text-accent animate-spin" />}
                                            {item.status === 'SUCCESS' && <CheckCircle className="size-4 text-emerald-500" />}
                                            {item.status === 'ERROR' && <XCircle className="size-4 text-destructive" />}
                                            {item.status === 'SKIPPED' && <span className="text-xs font-bold text-muted uppercase">Skipped</span>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-auto shrink-0 flex justify-end gap-3 p-6 pt-0 border-t border-border mt-2">
                <SecondaryButton type="button" onClick={handleClose} disabled={isUploading}>Close</SecondaryButton>
                <PrimaryButton onClick={startUploads} disabled={isUploading || uploadQueue.length === 0 || uploadQueue.every(q => ['SUCCESS', 'SKIPPED'].includes(q.status))}>
                    {isUploading ? 'Uploading...' : 'Start Upload'}
                </PrimaryButton>
            </div>

            {/* Conflict Resolution Modal */}
            {conflictState && (
                <Modal isOpen={true} onClose={() => {}} title="File Already Exists" className="w-full max-w-md">
                    <div className="p-4 flex flex-col gap-4">
                        <p className="text-sm text-main">
                            A {conflictState.item.isFolder ? 'folder' : 'file'} named <strong>{conflictState.item.name}</strong> already exists in this location.
                        </p>
                        <p className="text-xs text-muted">What would you like to do?</p>
                        <div className="flex flex-col gap-2 pt-2">
                            <PrimaryButton onClick={() => handleConflictResolution('REPLACE')} className="w-full justify-center">
                                Replace (Create New Version)
                            </PrimaryButton>
                            <SecondaryButton onClick={() => handleConflictResolution('UPLOAD_ANYWAY')} className="w-full justify-center">
                                Upload Anyway (Rename to (1))
                            </SecondaryButton>
                            <DestructiveButton onClick={() => handleConflictResolution('SKIP')} className="w-full justify-center">
                                Skip
                            </DestructiveButton>
                        </div>
                    </div>
                </Modal>
            )}
        </Modal>
    );
}
