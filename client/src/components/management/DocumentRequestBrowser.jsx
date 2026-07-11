import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, FolderOpen, CheckCircle, XCircle, FileText, Plus, Filter } from 'lucide-react';
import { Card } from '../ui/Containers';
import { InputField } from '../ui/Textfields';
import { PrimaryButton } from '../ui/Buttons';
import { FilterMenu } from '../ui/Menus';
import { Badge } from '../ui/Badges';
import { DOCUMENT_REQUESTS_STATUS } from '../../constants';
import { getAvatarUrl } from '../../utils/avatar';

// ==============================================================================
// SECTION 1: UTILITIES
// ==============================================================================

const SORT_STATES = Object.freeze(['DEFAULT', 'ASC', 'DESC']);

const renderSortIcon = (col, currentSortCol, currentSortState, type = 'ARROW') => {
    if (currentSortCol !== col || currentSortState === 'DEFAULT') {
        return type === 'ARROW' ? <ArrowUpDown className="size-3 text-muted" /> : <Filter className="size-3 text-muted" />;
    }
    if (type === 'ARROW') {
        return currentSortState === 'ASC' ? <ArrowUp className="size-3 text-accent" /> : <ArrowDown className="size-3 text-accent" />;
    }
    return <Filter className="size-3 text-accent" fill="currentColor" />;
};

const STATUS_OPTIONS = [
    { value: DOCUMENT_REQUESTS_STATUS.OPEN, label: 'Open', icon: FolderOpen },
    { value: DOCUMENT_REQUESTS_STATUS.RESOLVED, label: 'Resolved', icon: CheckCircle },
    { value: DOCUMENT_REQUESTS_STATUS.REJECTED, label: 'Rejected', icon: XCircle },
];

const STATUS_STATES = ['DEFAULT', ...Object.values(DOCUMENT_REQUESTS_STATUS)];

// ==============================================================================
// SECTION 2: COMPONENT
// ==============================================================================

export default function DocumentRequestBrowser({ title, description, requests, users, activeRequestId, onRequestClick, onCreateRequest }) {
    const [filter, setFilter] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [sortCol, setSortCol] = useState('DATE');
    const [sortState, setSortState] = useState('DESC');

    const toggleStatus = (status) => setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);

    const filterGroups = [
        { title: 'Statuses', options: STATUS_OPTIONS, selected: selectedStatuses, onToggle: toggleStatus }
    ];

    const handleSort = (col) => {
        if (col === 'STATUS') {
            if (sortCol !== col) { setSortCol(col); setSortState(STATUS_STATES[1]); }
            else { setSortState(STATUS_STATES[(STATUS_STATES.indexOf(sortState) + 1) % STATUS_STATES.length]); }
        } else {
            if (sortCol !== col) { setSortCol(col); setSortState('ASC'); }
            else { 
                const idx = SORT_STATES.indexOf(sortState);
                setSortState(SORT_STATES[(idx === -1 ? 0 : idx + 1) % SORT_STATES.length]); 
            }
        }
    };

    // --- Filtered + sorted requests ---
    const displayRequests = useMemo(() => {
        let result = [...(requests || [])];

        if (filter) {
            result = result.filter(r => r.subject.toLowerCase().includes(filter.toLowerCase()));
        }

        if (selectedStatuses.length > 0) result = result.filter(r => selectedStatuses.includes(r.status));

        if (sortCol === 'STATUS' && sortState !== 'DEFAULT') result = result.filter(r => r.status === sortState);

        let isSorted = false;
        if (sortState !== 'DEFAULT') {
            if (sortCol === 'REQUESTER') {
                isSorted = true;
                result.sort((a, b) => {
                    const reqA = users.find(u => u.id === a.requester_id);
                    const reqB = users.find(u => u.id === b.requester_id);
                    const nameA = reqA ? `${reqA.first_name} ${reqA.last_name}` : '';
                    const nameB = reqB ? `${reqB.first_name} ${reqB.last_name}` : '';
                    return sortState === 'ASC' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                });
            } else if (sortCol === 'SUBJECT') {
                isSorted = true;
                result.sort((a, b) => sortState === 'ASC' ? a.subject.localeCompare(b.subject) : b.subject.localeCompare(a.subject));
            } else if (sortCol === 'DATE') {
                isSorted = true;
                result.sort((a, b) => sortState === 'ASC' ? new Date(a.updated_at) - new Date(b.updated_at) : new Date(b.updated_at) - new Date(a.updated_at));
            }
        }
        
        if (!isSorted) {
            result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }

        return result;
    }, [requests, users, filter, selectedStatuses, sortCol, sortState]);

    return (
        <section className="flex flex-col gap-4">
            {/* --- Header --- */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-xl font-bold text-main">{title}</h2>
                    {description && <p className="mt-1 text-xs text-muted">{description}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="w-full md:w-64">
                        <InputField
                            leftIcon={Search}
                            placeholder={`Search subjects...`}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <FilterMenu groups={filterGroups} />
                    {onCreateRequest && (
                        <PrimaryButton icon={Plus} onClick={onCreateRequest}>New Request</PrimaryButton>
                    )}
                </div>
            </div>

            {/* --- Body --- */}
            <Card className="overflow-hidden">
                <div className="max-h-[480px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-main">
                        <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs font-semibold uppercase text-muted">
                        <tr>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('SUBJECT')}>
                                <div className="flex items-center gap-1">Subject {renderSortIcon('SUBJECT', sortCol, sortState)}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('REQUESTER')}>
                                <div className="flex items-center gap-1">Requester {renderSortIcon('REQUESTER', sortCol, sortState)}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('STATUS')}>
                                <div className="flex items-center gap-1">{sortCol === 'STATUS' && sortState !== 'DEFAULT' ? `Status (${sortState.replace(/_/g, ' ')})` : 'Status'} {renderSortIcon('STATUS', sortCol, sortState, 'FILTER')}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('DATE')}>
                                <div className="flex items-center gap-1">Last Updated {renderSortIcon('DATE', sortCol, sortState)}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {displayRequests.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-muted">No requests found.</td>
                            </tr>
                        ) : (
                            displayRequests.map(req => {
                                const isSelected = activeRequestId === req.id;
                                const requester = users.find(u => u.id === req.requester_id);
                                return (
                                    <tr
                                        key={req.id}
                                        className={`group cursor-pointer border-b border-border transition-colors duration-200 last:border-0 ${isSelected ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
                                        onClick={() => onRequestClick(req.id)}
                                    >
                                        <td className="px-4 py-4 font-bold max-w-xs truncate">
                                            <div className="flex items-center gap-2">
                                                <FileText className={`size-4 shrink-0 transition-colors duration-200 ${isSelected ? 'text-accent' : 'text-muted group-hover:text-accent'}`} />
                                                <span className={`truncate font-bold transition-colors duration-200 ${isSelected ? 'text-accent' : 'text-main group-hover:text-accent'}`}>{req.subject}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {requester ? (
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={getAvatarUrl(requester.avatar_path) || '/assets/default_avatar.jpg'} 
                                                        alt="Avatar" 
                                                        className="h-6 w-6 rounded-full object-cover shrink-0" 
                                                    />
                                                    <span className={`max-w-[12rem] truncate font-medium text-main`}>
                                                        {requester.first_name} {requester.last_name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted">Unknown User</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge label={req.status} variant="neutral" size="small" />
                                        </td>
                                        <td className="px-4 py-4 font-medium text-muted">
                                            {new Date(req.updated_at).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
        </section>
    );
}
