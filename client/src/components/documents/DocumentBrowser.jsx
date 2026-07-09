import { useState, useRef } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, LayoutGrid, List, Plus, Share2, Archive, XCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { Card } from '../ui/Containers';
import { Badge } from '../ui/Badges';
import { InputField } from '../ui/Textfields';
import { IconButton, PrimaryButton } from '../ui/Buttons';
import { getFileIcon } from '../ui/FileIcon';
import { FilterMenu } from '../ui/Menus';
import DocumentCard from './DocumentCard';
import { DOCUMENT_SHARE_STATUS } from '../../constants';
import { useDocumentShare, useAuthentication, useUser } from '../../stores';

// ==============================================================================
// SECTION 1: UTILITIES
// ==============================================================================

const SORT_STATES = Object.freeze(['DEFAULT', 'ASC', 'DESC']);
const STATUS_FILTER_STATES = Object.freeze(['DEFAULT', 'UPLOADED', ...Object.values(DOCUMENT_SHARE_STATUS)]);

const renderSortIcon = (col, currentSortCol, currentSortState, type = 'ARROW') => {
    if (currentSortCol !== col || currentSortState === 'DEFAULT') {
        return type === 'ARROW' ? <ArrowUpDown className="size-3 text-muted" /> : <Filter className="size-3 text-muted" />;
    }

    if (type === 'ARROW') {
        return currentSortState === 'ASC' ? <ArrowUp className="size-3 text-accent" /> : <ArrowDown className="size-3 text-accent" />;
    } else {
        return <Filter className={`size-3 ${currentSortState !== 'DEFAULT' ? 'text-accent' : 'text-muted'}`} fill={currentSortState !== 'DEFAULT' ? 'currentColor' : 'none'} />;
    }
};

// ==============================================================================
// SECTION 2: COMPONENT
// ==============================================================================

/**
 * DocumentBrowser — Reusable document list section.
 * Handles its own internal sort/filter/view state.
 * Used across Dashboard, Documents, and Archives pages.
 *
 * Props:
 *   title       — Section heading
 *   description — Section subheading
 *   documents   — Array of document objects to display
 *   documentVersions — Array of all document versions (to resolve latestVersion)
 *   activeDocumentId — Currently selected document id
 *   onDocumentClick  — (id) => void
 *   onDocumentDoubleClick — (id) => void
 *   customStatus     — { header: string, render: (doc) => ReactNode }
 *   canAddDocuments  — boolean
 *   onAddDocuments   — () => void
 *   isArchiveBrowser — boolean
 */
export default function DocumentBrowser({ title, description, documents, documentVersions, activeDocumentId, onDocumentClick, onDocumentDoubleClick, customStatus, canAddDocuments, onAddDocuments, isArchiveBrowser = false }) {
    const [filter, setFilter] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [sortCol, setSortCol] = useState('DATE');
    const [sortState, setSortState] = useState('DEFAULT');
    const [view, setView] = useState('TABLE'); // 'TABLE' | 'CARD'
    
    // Click timer ref to distinguish single vs double click
    const clickTimeoutRef = useRef(null);
    
    const { documentShares } = useDocumentShare();
    const { user } = useAuthentication();
    const { users } = useUser();

    const getDocumentStatus = (doc) => {
        if (doc.is_archived) return 'ARCHIVED';
        const share = documentShares.find(s => s.document_id === doc.id && s.department_id === user?.department_id);
        if (share) return share.status;
        return 'UPLOADED';
    };

    const toggleStatus = (status) => {
        setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    const handleRowClick = (id) => {
        if (clickTimeoutRef.current) {
            // If there's an existing timer, it's a double click
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            if (onDocumentDoubleClick) onDocumentDoubleClick(id);
        } else {
            // Otherwise, wait to see if it's a single click
            clickTimeoutRef.current = setTimeout(() => {
                if (onDocumentClick) onDocumentClick(id);
                clickTimeoutRef.current = null;
            }, 150);
        }
    };

    const filterGroups = [
        {
            title: 'Statuses',
            options: ['UPLOADED', ...Object.values(DOCUMENT_SHARE_STATUS)].map(s => ({ value: s, label: s.replace(/_/g, ' ') })),
            selected: selectedStatuses,
            onToggle: toggleStatus
        }
    ];

    const handleSort = (col) => {
        if (col === 'STATUS') {
            if (sortCol !== col) {
                setSortCol(col);
                setSortState(STATUS_FILTER_STATES[1]);
            } else {
                const nextIndex = (STATUS_FILTER_STATES.indexOf(sortState) + 1) % STATUS_FILTER_STATES.length;
                setSortState(STATUS_FILTER_STATES[nextIndex]);
            }
        } else {
            if (sortCol !== col) {
                setSortCol(col);
                setSortState('ASC');
            } else {
                const currentStateIndex = SORT_STATES.indexOf(sortState);
                const safeIndex = currentStateIndex === -1 ? 0 : currentStateIndex;
                const nextIndex = (safeIndex + 1) % SORT_STATES.length;
                setSortState(SORT_STATES[nextIndex]);
            }
        }
    };

    // --- Filtered + sorted documents ---
    const displayDocuments = (() => {
        let result = [...documents];

        if (!isArchiveBrowser) {
            result = result.filter(d => !d.is_archived);
        } else {
            result = result.filter(d => d.is_archived);
        }

        if (filter) {
            result = result.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()));
        }

        if (selectedStatuses.length > 0) {
            result = result.filter(d => selectedStatuses.includes(getDocumentStatus(d)));
        }

        if (sortCol === 'STATUS' && sortState !== 'DEFAULT') {
            result = result.filter(d => getDocumentStatus(d) === sortState);
        }

        let isSorted = false;
        if (sortState !== 'DEFAULT' && ['DATE', 'NAME'].includes(sortCol)) {
            isSorted = true;
            if (sortCol === 'DATE') {
                result.sort((a, b) => sortState === 'ASC' ? new Date(a.updated_at) - new Date(b.updated_at) : new Date(b.updated_at) - new Date(a.updated_at));
            } else if (sortCol === 'NAME') {
                result.sort((a, b) => sortState === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
            }
        }
        
        if (!isSorted) {
            result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }

        return result;
    })();

    return (
        <section className="flex flex-col gap-4">
            {/* --- Header --- */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-xl font-bold text-main">{title}</h2>
                    {description && <p className="mt-1 text-xs text-muted">{description}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-64">
                        <InputField
                            leftIcon={Search}
                            placeholder={`Search ${title.toLowerCase()}...`}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    {canAddDocuments && (
                        <PrimaryButton icon={Plus} size="medium" onClick={onAddDocuments}>
                            Add Documents
                        </PrimaryButton>
                    )}
                    <FilterMenu groups={filterGroups} />
                    <div className="flex items-center rounded-md border border-border bg-surface p-1">
                        <IconButton icon={List} size="small" active={view === 'TABLE'} onClick={() => setView('TABLE')} />
                        <IconButton icon={LayoutGrid} size="small" active={view === 'CARD'} onClick={() => setView('CARD')} />
                    </div>
                </div>
            </div>

            {/* --- Body --- */}
            {view === 'CARD' ? (
                displayDocuments.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted">No documents found.</div>
                ) : (
                    <div className="grid max-h-[480px] overflow-y-auto gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))] pr-2">
                        {displayDocuments.map(doc => {
                            const latestVersion = documentVersions.find(v => v.document_id === doc.id);
                            const isShared = documentShares.some(s => s.document_id === doc.id);
                            return (
                                <DocumentCard
                                    key={doc.id}
                                    document={{ ...doc, status: getDocumentStatus(doc) }}
                                    latestVersion={latestVersion}
                                    isSelected={activeDocumentId === doc.id}
                                    isShared={isShared}
                                    hasRejected={documentShares.some(s => s.document_id === doc.id && s.status === 'REJECTED')}
                                    hasApproved={documentShares.some(s => s.document_id === doc.id && s.status === 'APPROVED')}
                                    hasComment={!!doc.comment}
                                    authorName={(() => {
                                        const uploader = users.find(u => u.id === doc.uploader_id);
                                        return uploader ? (uploader.id === user?.id ? 'Me' : `${uploader.first_name} ${uploader.last_name}`) : 'Unknown';
                                    })()}
                                    onClick={() => handleRowClick(doc.id)}
                                />
                            );
                        })}
                    </div>
                )
            ) : (
                <Card className="max-h-[480px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-main">
                        <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs font-semibold uppercase text-muted">
                            <tr>
                                <th
                                    className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent"
                                    onClick={() => handleSort('NAME')}
                                >
                                    <div className="flex items-center gap-1">Document Name {renderSortIcon('NAME', sortCol, sortState)}</div>
                                </th>
                                <th className="px-4 py-3">
                                    <div className="flex items-center gap-1">Author</div>
                                </th>
                                <th className="px-4 py-3">
                                    <div className="flex items-center gap-1">Version</div>
                                </th>
                                <th
                                    className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent"
                                    onClick={() => handleSort('DATE')}
                                >
                                    <div className="flex items-center gap-1">Modified {renderSortIcon('DATE', sortCol, sortState)}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-background">
                            {displayDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-4 py-8 text-center text-muted">No documents found.</td>
                                </tr>
                            ) : (
                                displayDocuments.map(doc => {
                                    const isSelected = activeDocumentId === doc.id;
                                    const latestVersion = documentVersions.find(v => v.document_id === doc.id);
                                    return (
                                        <tr
                                            key={doc.id}
                                            className={`cursor-pointer transition-colors duration-200 hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`}
                                            onClick={() => handleRowClick(doc.id)}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex items-center justify-center ${isSelected ? 'text-accent' : 'text-muted'}`}>
                                                        {getFileIcon(doc.is_folder, latestVersion?.mime_type, 'size-4')}
                                                    </div>
                                                    <div className="flex items-center gap-2 max-w-[200px] md:max-w-xs">
                                                        <span className={`truncate font-bold ${isSelected ? 'text-accent' : 'text-main'}`}>
                                                            {doc.name}
                                                        </span>
                                                        <div className="flex shrink-0 gap-1">
                                                            {doc.is_archived ? <Archive className="size-3.5 text-muted" /> : (documentShares.some(s => s.document_id === doc.id) && <Share2 className="size-3.5 text-success" />)}
                                                            {(() => {
                                                                const docSpecificShares = documentShares.filter(s => s.document_id === doc.id);
                                                                if (docSpecificShares.some(s => s.status === 'REJECTED')) return <XCircle className="size-3.5 text-error" />;
                                                                if (docSpecificShares.some(s => s.status === 'APPROVED')) return <CheckCircle className="size-3.5 text-success" />;
                                                                return null;
                                                            })()}
                                                            {doc.comment && <MessageSquare className="size-3.5 text-warning" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-muted truncate max-w-[120px]">
                                                {(() => {
                                                    const uploader = users.find(u => u.id === doc.uploader_id);
                                                    return uploader ? (uploader.id === user?.id ? 'Me' : `${uploader.first_name} ${uploader.last_name}`) : 'Unknown';
                                                })()}
                                            </td>
                                            <td className="px-4 py-4 text-muted">
                                                {doc.is_folder ? '-' : `v${latestVersion?.version || 1}`}
                                            </td>
                                            <td className="px-4 py-4 font-medium text-muted">
                                                {new Date(doc.updated_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </Card>
            )}
        </section>
    );
}
