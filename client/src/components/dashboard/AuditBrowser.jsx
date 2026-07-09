import { useState } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, FileText, FileClock, XCircle, Clock, Activity, User, Building, MessageSquare } from 'lucide-react';
import { Card } from '../ui/Containers';
import { Badge } from '../ui/Badges';
import { InputField } from '../ui/Textfields';
import { FilterMenu } from '../ui/Menus';
import { useUser } from '../../stores';
import { AUDIT_LOGS_ENTITY_TYPE, AUDIT_LOGS_ACTION } from '../../constants';

// ==============================================================================
// SECTION 1: UTILITIES
// ==============================================================================

const SORT_STATES = Object.freeze(['DEFAULT', 'ASC', 'DESC']);
const ENTITY_FILTER_STATES = Object.freeze(['DEFAULT', ...Object.values(AUDIT_LOGS_ENTITY_TYPE)]);
const ACTION_FILTER_STATES = Object.freeze(['DEFAULT', ...Object.values(AUDIT_LOGS_ACTION)]);

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

export default function AuditBrowser({ title, description, audits, activeAuditLogId, onAuditClick }) {
    const { users } = useUser();
    const [filter, setFilter] = useState('');
    const [selectedActions, setSelectedActions] = useState([]);
    const [sortCol, setSortCol] = useState('DATE');
    const [sortState, setSortState] = useState('DEFAULT');
    const [selectedEntities, setSelectedEntities] = useState([]);

    const toggleAction = (action) => setSelectedActions(prev => prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]);
    const toggleEntity = (entity) => setSelectedEntities(prev => prev.includes(entity) ? prev.filter(e => e !== entity) : [...prev, entity]);

    const filterGroups = [
        { 
            title: 'Actions', 
            options: Object.values(AUDIT_LOGS_ACTION).map(a => ({ value: a, label: a.replace(/_/g, ' ') })), 
            selected: selectedActions, 
            onToggle: toggleAction 
        },
        { 
            title: 'Entities', 
            options: Object.values(AUDIT_LOGS_ENTITY_TYPE).map(e => ({ value: e, label: e.replace(/_/g, ' ') })), 
            selected: selectedEntities, 
            onToggle: toggleEntity 
        }
    ];

    const handleSort = (col) => {
        if (col === 'ENTITY') {
            if (sortCol !== col) {
                setSortCol(col);
                setSortState(ENTITY_FILTER_STATES[1]);
            } else {
                const nextIndex = (ENTITY_FILTER_STATES.indexOf(sortState) + 1) % ENTITY_FILTER_STATES.length;
                setSortState(ENTITY_FILTER_STATES[nextIndex]);
            }
        } else if (col === 'ACTION') {
            if (sortCol !== col) {
                setSortCol(col);
                setSortState(ACTION_FILTER_STATES[1]);
            } else {
                const nextIndex = (ACTION_FILTER_STATES.indexOf(sortState) + 1) % ACTION_FILTER_STATES.length;
                setSortState(ACTION_FILTER_STATES[nextIndex]);
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

    // --- Filtered + sorted audits ---
    const displayAudits = (() => {
        let result = [...audits];

        if (selectedActions.length > 0) result = result.filter(a => selectedActions.includes(a.action));
        if (selectedEntities.length > 0) result = result.filter(a => selectedEntities.includes(a.entity_type));

        if (filter) {
            const term = filter.toLowerCase();
            result = result.filter(a => 
                a.action.toLowerCase().includes(term) || 
                a.entity_type.toLowerCase().includes(term) || 
                (a.actor_id && a.actor_id.toLowerCase().includes(term))
            );
        }

        if (sortCol === 'ENTITY' && sortState !== 'DEFAULT') {
            result = result.filter(a => a.entity_type === sortState);
        }

        if (sortCol === 'ACTION' && sortState !== 'DEFAULT') {
            result = result.filter(a => a.action === sortState);
        }

        let isSorted = false;
        if (sortState !== 'DEFAULT' && ['DATE', 'ACTOR'].includes(sortCol)) {
            isSorted = true;
            if (sortCol === 'DATE') {
                result.sort((a, b) => sortState === 'ASC' ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at));
            } else if (sortCol === 'ACTOR') {
                const getActorName = (id) => {
                    if (!id) return 'System';
                    const u = users.find(u => u.id === id);
                    return u ? `${u.first_name} ${u.last_name}` : 'Unknown User';
                };
                result.sort((a, b) => {
                    const nameA = getActorName(a.actor_id);
                    const nameB = getActorName(b.actor_id);
                    return sortState === 'ASC' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                });
            }
        } 
        
        if (!isSorted) {
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        return result;
    })();

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
                            placeholder={`Search logs...`}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <FilterMenu groups={filterGroups} />
                </div>
            </div>

            {/* --- Body --- */}
            <Card className="overflow-hidden">
                <div className="max-h-[480px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-main">
                        <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs font-semibold uppercase text-muted">
                        <tr>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('ACTION')}>
                                <div className="flex items-center gap-1">{sortCol === 'ACTION' && sortState !== 'DEFAULT' ? `Action (${sortState.replace(/_/g, ' ')})` : 'Action'} {renderSortIcon('ACTION', sortCol, sortState, 'FILTER')}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('ENTITY')}>
                                <div className="flex items-center gap-1">{sortCol === 'ENTITY' && sortState !== 'DEFAULT' ? `Entity (${sortState.replace(/_/g, ' ')})` : 'Entity'} {renderSortIcon('ENTITY', sortCol, sortState, 'FILTER')}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('ACTOR')}>
                                <div className="flex items-center gap-1">Actor {renderSortIcon('ACTOR', sortCol, sortState)}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('DATE')}>
                                <div className="flex items-center gap-1">Timestamp {renderSortIcon('DATE', sortCol, sortState)}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {displayAudits.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-8 text-center text-muted">No audit logs found.</td>
                            </tr>
                        ) : (
                            displayAudits.map(audit => {
                                const isSelected = activeAuditLogId === audit.id;
                                return (
                                    <tr 
                                        key={audit.id} 
                                        className={`cursor-pointer transition-colors duration-200 hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`} 
                                        onClick={() => onAuditClick(audit.id)}
                                    >
                                        <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex items-center justify-center ${isSelected ? 'text-accent' : 'text-muted'}`}>
                                                {(() => {
                                                    switch (audit.entity_type) {
                                                        case 'DOCUMENT':
                                                        case 'DOCUMENT_VERSION':
                                                        case 'DOCUMENT_SHARE':
                                                            return <FileText className="size-4" />;
                                                        case 'USER':
                                                        case 'USER_CREDENTIAL':
                                                        case 'USER_SESSION':
                                                        case 'USER_SETTING':
                                                            return <User className="size-4" />;
                                                        case 'DEPARTMENT':
                                                            return <Building className="size-4" />;
                                                        case 'DOCUMENT_REQUEST':
                                                        case 'DOCUMENT_REQUEST_ATTACHMENT':
                                                        case 'DOCUMENT_REQUEST_MESSAGE':
                                                        case 'COORDINATOR_REQUEST':
                                                            return <MessageSquare className="size-4" />;
                                                        default:
                                                            return <Activity className="size-4" />;
                                                    }
                                                })()}
                                            </div>
                                            <span className={`font-bold ${isSelected ? 'text-accent' : 'text-main'}`}>
                                                {audit.action.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Badge label={audit.entity_type} variant="neutral" size="small" />
                                    </td>
                                    <td className="px-4 py-4">
                                        {(() => {
                                            if (!audit.actor_id) return <span className="font-medium text-main">System</span>;
                                            const actor = users.find(u => u.id === audit.actor_id);
                                            if (!actor) return <span className="font-medium text-main">Unknown User</span>;
                                            
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <img src={actor.avatar_path || '/assets/default_avatar.jpg'} alt="Avatar" className="h-5 w-5 rounded-full object-cover shrink-0" />
                                                    <span className="font-medium text-main">{actor.first_name} {actor.last_name}</span>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-4 py-4 font-medium text-muted">
                                        {new Date(audit.created_at).toLocaleString()}
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
