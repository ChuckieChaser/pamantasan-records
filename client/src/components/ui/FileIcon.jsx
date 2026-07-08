import { Folder, FileText, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';

export const getFileIcon = (isFolder, mimeType, className = "size-8") => {
    if (isFolder) return <Folder className={className} />;
    if (!mimeType) return <FileText className={className} />;
    if (mimeType.includes('pdf')) return <FileText className={className} />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className={className} />;
    if (mimeType.includes('image')) return <ImageIcon className={className} />;
    return <FileText className={className} />;
};
