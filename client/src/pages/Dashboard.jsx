import { useEffect, useState, useMemo } from 'react';
import {
    FileText, FileClock, XCircle, Search, Clock, File, Share2,
    ArrowUpDown, ArrowUp, ArrowDown, Filter, LayoutGrid, List
} from 'lucide-react';

import { useAuthentication, useDocument, useCoordinatorRequest, useDocumentRequest, useDocumentVersion, useDocumentShare } from '../stores';
import { USERS_ROLE, COORDINATOR_REQUESTS_STATUS, DOCUMENT_REQUESTS_STATUS, DOCUMENTS_STATUS } from '../constants';

import { Card, CardBody, InputField, Badge, IconButton, getFileIcon } from '../components/ui';
import MetricCard from '../components/dashboard/MetricCard';

const SORT_STATES = ['DEFAULT', 'ASC', 'DESC'];

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

const FilterMenu = ({ selectedStatuses, onToggleStatus }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <IconButton icon={Filter} size="medium" onClick={() => setIsOpen(!isOpen)} active={selectedStatuses.length > 0 || isOpen} />
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-surface p-2 shadow-lg">
                        <span className="mb-2 block px-2 text-xs font-bold text-muted uppercase">Filter by Status</span>
                        {Object.values(DOCUMENTS_STATUS).map(status => (
                            <label key={status} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-surface-hover">
                                <input
                                    type="checkbox"
                                    className="rounded border-border text-accent focus:ring-accent"
                                    checked={selectedStatuses.includes(status)}
                                    onChange={() => onToggleStatus(status)}
                                />
                                <span className="text-sm font-medium text-main">{status}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default function Dashboard() {
    const { user } = useAuthentication();
    const { documents, activeDocument, getAll: getDocuments, selectActiveDocument, deselectActiveDocument } = useDocument();
    const { coordinatorRequests, getAll: getCoordinatorRequests } = useCoordinatorRequest();
    const { documentRequests, getAll: getDocumentRequests } = useDocumentRequest();
    const { documentVersions, getAll: getDocumentVersions } = useDocumentVersion();
    const { documentShares, getByDepartmentId } = useDocumentShare();

    // Tables state - Recent (Document Browser)
    const [currentFolderId, setCurrentFolderId] = useState(null); // Prep for folder navigation
    const [recentFilter, setRecentFilter] = useState('');
    const [recentStatuses, setRecentStatuses] = useState([]);
    const [recentSortCol, setRecentSortCol] = useState('DATE');
    const [recentSort, setRecentSort] = useState('DEFAULT');
    const [recentView, setRecentView] = useState('TABLE'); // 'TABLE' or 'CARD'
    useEffect(() => {
        getDocuments();

        if (user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) {
            getCoordinatorRequests();
            getDocumentRequests();
            getDocumentVersions();
        }

        if (user?.department_id) {
            getByDepartmentId(user.department_id);
        }

        return () => {
            deselectActiveDocument();
        };
    }, [user, getDocuments, getCoordinatorRequests, getDocumentRequests, getDocumentVersions, getByDepartmentId, deselectActiveDocument]);

    // Documents RLS Access Control Filter
    const visibleDocuments = useMemo(() => {
        if (!user) return [];
        if (user.role === USERS_ROLE.ADMINISTRATOR || user.role === USERS_ROLE.COORDINATOR) return documents;

        return documents.filter(doc => {
            if (doc.status === 'ARCHIVED') return false;
            if (doc.uploader_id === user.id) return true;

            const isRejecter = documentVersions.some(dv => dv.document_id === doc.id && dv.rejecter_id === user.id);
            if (isRejecter) return true;

            const hasAccess = documentShares.some(ds => {
                if (ds.document_id === doc.id) {
                    if (ds.department_id === user.department_id) {
                        if ((doc.status === 'PENDING_OFFICER' || doc.status === 'PENDING_DIRECTOR' || doc.status === 'PUBLISHED') && user.role === USERS_ROLE.OFFICER) return true;
                        if ((doc.status === 'PENDING_DIRECTOR' || doc.status === 'PUBLISHED') && user.role === USERS_ROLE.DIRECTOR) return true;
                        if (doc.status === 'PUBLISHED' && user.role === USERS_ROLE.MEMBER && (!ds.recipient_id || ds.recipient_id === user.id)) return true;
                    }
                    if (doc.status === DOCUMENTS_STATUS.ATTACHMENT && ds.document_request_id) {
                        const req = documentRequests.find(dr => dr.id === ds.document_request_id);
                        if (req && req.requester_id === user.id) return true;
                    }
                }
                return false;
            });

            return hasAccess;
        });
    }, [documents, user, documentVersions, documentShares, documentRequests]);

    // Metrics calculation
    const totalDocuments = useMemo(() => visibleDocuments.filter(d => !d.is_folder).length, [visibleDocuments]);

    const pendingCoordinator = useMemo(() =>
        coordinatorRequests.filter(r => r.status === COORDINATOR_REQUESTS_STATUS.PENDING).length
        , [coordinatorRequests]);

    const pendingDocumentReq = useMemo(() =>
        documentRequests.filter(r => r.status === DOCUMENT_REQUESTS_STATUS.OPEN).length
        , [documentRequests]);

    const rejectedDocuments = useMemo(() =>
        documentVersions.filter(v => v.rejected_at !== null).length
        , [documentVersions]);

    // Tables state - Shared
    const [sharedFilter, setSharedFilter] = useState('');
    const [sharedStatuses, setSharedStatuses] = useState([]);
    const [sharedSortCol, setSharedSortCol] = useState('DATE');
    const [sharedSort, setSharedSort] = useState('DEFAULT');
    const [sharedView, setSharedView] = useState('TABLE');

    const toggleRecentStatus = (status) => {
        setRecentStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    const toggleSharedStatus = (status) => {
        setSharedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
    };

    const handleSort = (col, currentSortCol, currentSortState, setSortCol, setSortState) => {
        if (currentSortCol !== col) {
            setSortCol(col);
            setSortState('ASC');
        } else {
            const nextIndex = (SORT_STATES.indexOf(currentSortState) + 1) % SORT_STATES.length;
            setSortState(SORT_STATES[nextIndex]);
        }
    };

    // Recent Documents
    const recentDocuments = useMemo(() => {
        // Filter out folders for now as requested, but logic is prepped via parent_id
        let filtered = visibleDocuments.filter(d => !d.is_folder);
        // let filtered = visibleDocuments.filter(d => d.parent_id === currentFolderId);

        if (recentFilter) {
            filtered = filtered.filter(d => d.name.toLowerCase().includes(recentFilter.toLowerCase()));
        }

        if (recentStatuses.length > 0) {
            filtered = filtered.filter(d => recentStatuses.includes(d.status));
        }

        if (recentSort !== 'DEFAULT') {
            if (recentSortCol === 'DATE') {
                filtered = filtered.sort((a, b) => recentSort === 'ASC' ? new Date(a.updated_at) - new Date(b.updated_at) : new Date(b.updated_at) - new Date(a.updated_at));
            } else if (recentSortCol === 'NAME') {
                filtered = filtered.sort((a, b) => recentSort === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
            } else if (recentSortCol === 'STATUS') {
                filtered = filtered.sort((a, b) => recentSort === 'ASC' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status));
            }
        } else {
            // Default: Most recent first
            filtered = filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }

        return filtered.slice(0, 5); // Limit to top 5
    }, [documents, recentFilter, recentStatuses, recentSort, recentSortCol]);

    // Shared Documents
    const sharedDocsList = useMemo(() => {
        const sharedDocs = documentShares.map(ds => visibleDocuments.find(d => d.id === ds.document_id)).filter(Boolean);
        const uniqueSharedDocs = Array.from(new Set(sharedDocs.map(d => d.id))).map(id => sharedDocs.find(d => d.id === id));

        let filtered = uniqueSharedDocs;

        if (sharedFilter) {
            filtered = filtered.filter(d => d.name.toLowerCase().includes(sharedFilter.toLowerCase()));
        }

        if (sharedStatuses.length > 0) {
            filtered = filtered.filter(d => sharedStatuses.includes(d.status));
        }

        if (sharedSort !== 'DEFAULT') {
            if (sharedSortCol === 'DATE') {
                filtered = filtered.sort((a, b) => sharedSort === 'ASC' ? new Date(a.updated_at) - new Date(b.updated_at) : new Date(b.updated_at) - new Date(a.updated_at));
            } else if (sharedSortCol === 'NAME') {
                filtered = filtered.sort((a, b) => sharedSort === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
            } else if (sharedSortCol === 'STATUS') {
                filtered = filtered.sort((a, b) => sharedSort === 'ASC' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status));
            }
        } else {
            filtered = filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }

        return filtered;
    }, [documentShares, documents, sharedFilter, sharedStatuses, sharedSort, sharedSortCol]);

    const handleDocumentClick = (id) => {
        if (activeDocument?.id === id) {
            deselectActiveDocument();
        } else {
            selectActiveDocument(id);
        }
    };

    // Render helpers
    const renderCardView = (docs) => (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
            {docs.map(doc => {
                const isSelected = activeDocument?.id === doc.id;
                const latestVersion = documentVersions.find(v => v.document_id === doc.id);
                return (
                    <Card
                        key={doc.id}
                        className={`cursor-pointer transition-colors duration-200 ${isSelected ? 'border-accent bg-surface-hover ring-1 ring-accent' : 'hover:border-accent'}`}
                        onClick={() => handleDocumentClick(doc.id)}
                    >
                        <CardBody className="flex flex-col gap-3 p-4 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-background text-accent' : 'bg-surface-hover text-muted'}`}>
                                    {getFileIcon(doc.is_folder, latestVersion?.mime_type, "size-5")}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={`block break-words font-bold line-clamp-2 transition-colors ${isSelected ? 'text-accent' : 'text-main'}`}>{doc.name}</span>
                                </div>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <Badge label={doc.status} variant="neutral" size="small" />
                                <span className="text-xs font-semibold text-muted">{new Date(doc.updated_at).toLocaleDateString()}</span>
                            </div>
                        </CardBody>
                    </Card>
                );
            })}
        </div>
    );

    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="text-3xl font-bold text-main">Dashboard</h1>
                <p className="mt-1 text-sm text-muted">Overview of the system activities and documents.</p>
            </div>

            {/* --- Overview Metrics --- */}
            {(user?.role === USERS_ROLE.ADMINISTRATOR || user?.role === USERS_ROLE.COORDINATOR) && (
                <section className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-main">Overview Metrics</h2>
                    <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                        <MetricCard title="Total Documents" value={totalDocuments} icon={FileText} colorTheme="accent" to="/documents" />
                        <MetricCard title="Pending Coordinator Requests" value={pendingCoordinator} icon={FileClock} colorTheme="warning" to="/management" />
                        <MetricCard title="Pending Document Requests" value={pendingDocumentReq} icon={Clock} colorTheme="warning" to="/requests" />
                        <MetricCard title="Rejected Documents" value={rejectedDocuments} icon={XCircle} colorTheme="error" to="/archives" />
                    </div>
                </section>
            )}

            {/* --- Recent Documents --- */}
            <section className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-main">Recent Documents</h2>
                        <p className="mt-1 text-xs text-muted">Documents recently modified or added.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-64">
                            <InputField
                                icon={Search}
                                placeholder="Search recent..."
                                value={recentFilter}
                                onChange={(e) => setRecentFilter(e.target.value)}
                            />
                        </div>
                        <FilterMenu selectedStatuses={recentStatuses} onToggleStatus={toggleRecentStatus} />
                        <div className="flex items-center rounded-md border border-border bg-surface p-1">
                            <IconButton icon={List} size="small" active={recentView === 'TABLE'} onClick={() => setRecentView('TABLE')} />
                            <IconButton icon={LayoutGrid} size="small" active={recentView === 'CARD'} onClick={() => setRecentView('CARD')} />
                        </div>
                    </div>
                </div>

                {recentView === 'CARD' ? (
                    recentDocuments.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted">No recent documents found.</div>
                    ) : (
                        renderCardView(recentDocuments)
                    )
                ) : (
                    <Card className="overflow-hidden">
                        <table className="w-full text-left text-sm text-main">
                            <thead className="border-b border-border bg-surface text-xs font-semibold uppercase text-muted">
                                <tr>
                                    <th
                                        className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent"
                                        onClick={() => handleSort('NAME', recentSortCol, recentSort, setRecentSortCol, setRecentSort)}
                                    >
                                        <div className="flex items-center gap-1">Document Name {renderSortIcon('NAME', recentSortCol, recentSort)}</div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent"
                                        onClick={() => handleSort('STATUS', recentSortCol, recentSort, setRecentSortCol, setRecentSort)}
                                    >
                                        <div className="flex items-center gap-1">Status {renderSortIcon('STATUS', recentSortCol, recentSort, 'FILTER')}</div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent"
                                        onClick={() => handleSort('DATE', recentSortCol, recentSort, setRecentSortCol, setRecentSort)}
                                    >
                                        <div className="flex items-center gap-1">
                                            Last Updated
                                            {renderSortIcon('DATE', recentSortCol, recentSort)}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {recentDocuments.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-muted">No recent documents found.</td>
                                    </tr>
                                ) : (
                                    recentDocuments.map((doc) => {
                                        const isSelected = activeDocument?.id === doc.id;
                                        const latestVersion = documentVersions.find(v => v.document_id === doc.id);
                                        return (
                                            <tr
                                                key={doc.id}
                                                className={`cursor-pointer transition-colors duration-200 hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`}
                                                onClick={() => handleDocumentClick(doc.id)}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex items-center justify-center ${isSelected ? 'text-accent' : 'text-muted'}`}>
                                                            {getFileIcon(doc.is_folder, latestVersion?.mime_type, "size-4")}
                                                        </div>
                                                        <span className={`font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-md ${isSelected ? 'text-accent' : 'text-main'}`}>{doc.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge label={doc.status} variant="neutral" size="small" />
                                                </td>
                                                <td className="px-4 py-4 font-medium text-muted">
                                                    {new Date(doc.updated_at).toLocaleDateString()}
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

            {/* --- Shared Documents --- */}
            <section className="flex flex-col gap-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-main">Shared Documents</h2>
                        <p className="mt-1 text-xs text-muted">Documents shared with your department or via requests.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-64">
                            <InputField
                                icon={Search}
                                placeholder="Search shared..."
                                value={sharedFilter}
                                onChange={(e) => setSharedFilter(e.target.value)}
                            />
                        </div>
                        <FilterMenu selectedStatuses={sharedStatuses} onToggleStatus={toggleSharedStatus} />
                        <div className="flex items-center rounded-md border border-border bg-surface p-1">
                            <IconButton icon={List} size="small" active={sharedView === 'TABLE'} onClick={() => setSharedView('TABLE')} />
                            <IconButton icon={LayoutGrid} size="small" active={sharedView === 'CARD'} onClick={() => setSharedView('CARD')} />
                        </div>
                    </div>
                </div>

                {sharedView === 'CARD' ? (
                    sharedDocsList.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted">No shared documents found.</div>
                    ) : (
                        renderCardView(sharedDocsList)
                    )
                ) : (
                    <Card className="overflow-hidden">
                        <table className="w-full text-left text-sm text-main">
                            <thead className="border-b border-border bg-surface text-xs font-semibold uppercase text-muted">
                                <tr>
                                    <th
                                        className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent"
                                        onClick={() => handleSort('NAME', sharedSortCol, sharedSort, setSharedSortCol, setSharedSort)}
                                    >
                                        <div className="flex items-center gap-1">Document Name {renderSortIcon('NAME', sharedSortCol, sharedSort)}</div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent"
                                        onClick={() => handleSort('STATUS', sharedSortCol, sharedSort, setSharedSortCol, setSharedSort)}
                                    >
                                        <div className="flex items-center gap-1">Status {renderSortIcon('STATUS', sharedSortCol, sharedSort, 'FILTER')}</div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent"
                                        onClick={() => handleSort('DATE', sharedSortCol, sharedSort, setSharedSortCol, setSharedSort)}
                                    >
                                        <div className="flex items-center gap-1">
                                            Last Updated
                                            {renderSortIcon('DATE', sharedSortCol, sharedSort)}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {sharedDocsList.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-muted">No shared documents found.</td>
                                    </tr>
                                ) : (
                                    sharedDocsList.map((doc) => {
                                        const isSelected = activeDocument?.id === doc.id;
                                        const latestVersion = documentVersions.find(v => v.document_id === doc.id);
                                        return (
                                            <tr
                                                key={doc.id}
                                                className={`cursor-pointer transition-colors duration-200 hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`}
                                                onClick={() => handleDocumentClick(doc.id)}
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex items-center justify-center text-muted`}>
                                                            {getFileIcon(doc.is_folder, latestVersion?.mime_type, "size-4")}
                                                        </div>
                                                        <span className={`font-bold truncate max-w-[200px] sm:max-w-xs md:max-w-md ${isSelected ? 'text-accent' : 'text-main'}`}>{doc.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge label={doc.status} variant="neutral" size="small" />
                                                </td>
                                                <td className="px-4 py-4 font-medium text-muted">
                                                    {new Date(doc.updated_at).toLocaleDateString()}
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
        </div>
    );
}
