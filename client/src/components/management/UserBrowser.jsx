import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, User, Shield, Activity, Users, FileSignature, CheckCircle, Clock, XCircle, Plus, Filter } from 'lucide-react';
import { Card } from '../ui/Containers';
import { InputField } from '../ui/Textfields';
import { PrimaryButton } from '../ui/Buttons';
import { FilterMenu } from '../ui/Menus';
import { Badge } from '../ui/Badges';
import UserModal from './UserModal';
import { USERS_ROLE, USERS_STATUS } from '../../constants';

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

const ROLE_OPTIONS = [
    { value: USERS_ROLE.ADMINISTRATOR, label: 'Administrator', icon: Shield },
    { value: USERS_ROLE.COORDINATOR, label: 'Coordinator', icon: Activity },
    { value: USERS_ROLE.DIRECTOR, label: 'Director', icon: User },
    { value: USERS_ROLE.OFFICER, label: 'Officer', icon: FileSignature },
    { value: USERS_ROLE.MEMBER, label: 'Member', icon: Users },
];

const STATUS_OPTIONS = [
    { value: USERS_STATUS.VERIFIED, label: 'Verified', icon: CheckCircle },
    { value: USERS_STATUS.PENDING_PASSWORD, label: 'Pending Password', icon: Clock },
    { value: USERS_STATUS.PENDING_SSO, label: 'Pending SSO', icon: Clock },
    { value: USERS_STATUS.SUSPENDED, label: 'Suspended', icon: XCircle },
];

const ROLE_STATES = ['DEFAULT', ...Object.values(USERS_ROLE)];
const STATUS_STATES = ['DEFAULT', ...Object.values(USERS_STATUS)];

// ==============================================================================
// SECTION 2: COMPONENT
// ==============================================================================

export default function UserBrowser({ title, description, users, departments, activeUserId, onUserClick }) {
    const [filter, setFilter] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [sortCol, setSortCol] = useState('NAME');
    const [sortState, setSortState] = useState('ASC');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const toggleRole = (role) => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    const toggleStatus = (status) => setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);

    const filterGroups = [
        { title: 'Roles', options: ROLE_OPTIONS, selected: selectedRoles, onToggle: toggleRole },
        { title: 'Statuses', options: STATUS_OPTIONS, selected: selectedStatuses, onToggle: toggleStatus }
    ];

    const DEPT_STATES = useMemo(() => ['DEFAULT', ...departments.map(d => d.id)], [departments]);

    const handleSort = (col) => {
        if (col === 'DEPARTMENT') {
            if (sortCol !== col) { setSortCol(col); setSortState(DEPT_STATES[1] || 'DEFAULT'); }
            else { setSortState(DEPT_STATES[(DEPT_STATES.indexOf(sortState) + 1) % DEPT_STATES.length]); }
        } else if (col === 'ROLE') {
            if (sortCol !== col) { setSortCol(col); setSortState(ROLE_STATES[1]); }
            else { setSortState(ROLE_STATES[(ROLE_STATES.indexOf(sortState) + 1) % ROLE_STATES.length]); }
        } else if (col === 'STATUS') {
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

    // --- Filtered + sorted users ---
    const displayUsers = useMemo(() => {
        let result = [...(users || [])];

        if (filter) {
            result = result.filter(u => 
                `${u.first_name} ${u.last_name}`.toLowerCase().includes(filter.toLowerCase()) || 
                u.university_id.toLowerCase().includes(filter.toLowerCase())
            );
        }

        if (selectedRoles.length > 0) result = result.filter(u => selectedRoles.includes(u.role));
        if (selectedStatuses.length > 0) result = result.filter(u => selectedStatuses.includes(u.status));

        if (sortCol === 'DEPARTMENT' && sortState !== 'DEFAULT') result = result.filter(u => u.department_id === sortState);
        if (sortCol === 'ROLE' && sortState !== 'DEFAULT') result = result.filter(u => u.role === sortState);
        if (sortCol === 'STATUS' && sortState !== 'DEFAULT') result = result.filter(u => u.status === sortState);

        let isSorted = false;
        if (sortState !== 'DEFAULT') {
            if (sortCol === 'NAME') {
                isSorted = true;
                result.sort((a, b) => sortState === 'ASC' ? a.first_name.localeCompare(b.first_name) : b.first_name.localeCompare(a.first_name));
            } else if (sortCol === 'UNIVERSITY_ID') {
                isSorted = true;
                result.sort((a, b) => sortState === 'ASC' ? a.university_id.localeCompare(b.university_id) : b.university_id.localeCompare(a.university_id));
            }
        }
        
        if (!isSorted) {
            result.sort((a, b) => a.first_name.localeCompare(b.first_name));
        }

        return result;
    }, [users, filter, selectedRoles, selectedStatuses, sortCol, sortState]);

    const getDeptHeaderLabel = () => {
        if (sortCol === 'DEPARTMENT' && sortState !== 'DEFAULT') {
            const dept = departments.find(d => d.id === sortState);
            return dept ? `Department (${dept.code})` : 'Department';
        }
        return 'Department';
    };

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
                            placeholder={`Search users...`}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <FilterMenu groups={filterGroups} />
                    <PrimaryButton icon={Plus} onClick={() => setIsAddModalOpen(true)}>Add User</PrimaryButton>
                </div>
            </div>

            {/* --- Body --- */}
            <Card className="overflow-hidden">
                <div className="max-h-[480px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-main">
                        <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs font-semibold uppercase text-muted">
                        <tr>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('NAME')}>
                                <div className="flex items-center gap-1">User {renderSortIcon('NAME', sortCol, sortState)}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('UNIVERSITY_ID')}>
                                <div className="flex items-center gap-1">University ID {renderSortIcon('UNIVERSITY_ID', sortCol, sortState)}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('DEPARTMENT')}>
                                <div className="flex items-center gap-1 max-w-[10rem] truncate">{getDeptHeaderLabel()} {renderSortIcon('DEPARTMENT', sortCol, sortState, 'FILTER')}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('ROLE')}>
                                <div className="flex items-center gap-1">{sortCol === 'ROLE' && sortState !== 'DEFAULT' ? `Role (${sortState.replace(/_/g, ' ')})` : 'Role'} {renderSortIcon('ROLE', sortCol, sortState, 'FILTER')}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('STATUS')}>
                                <div className="flex items-center gap-1">{sortCol === 'STATUS' && sortState !== 'DEFAULT' ? `Status (${sortState.replace(/_/g, ' ')})` : 'Status'} {renderSortIcon('STATUS', sortCol, sortState, 'FILTER')}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {displayUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center text-muted">No users found.</td>
                            </tr>
                        ) : (
                            displayUsers.map(user => {
                                const isSelected = activeUserId === user.id;
                                const department = departments.find(d => d.id === user.department_id);
                                return (
                                    <tr
                                        key={user.id}
                                        className={`group cursor-pointer border-b border-border transition-colors duration-200 last:border-0 ${isSelected ? 'bg-surface-hover' : 'hover:bg-surface-hover'}`}
                                        onClick={() => onUserClick(user.id)}
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={user.avatar_path || '/assets/default_avatar.jpg'} 
                                                    alt="Avatar" 
                                                    className="h-6 w-6 rounded-full object-cover shrink-0" 
                                                />
                                                <span className={`max-w-[12rem] truncate font-bold transition-colors duration-200 ${isSelected ? 'text-accent' : 'text-main group-hover:text-accent'}`}>
                                                    {user.first_name} {user.last_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-mono text-muted">
                                            {user.university_id}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-main max-w-[12rem] truncate">
                                            {department ? department.name : 'Unknown'}
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge label={user.role} variant="neutral" size="small" />
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge label={user.status} variant="neutral" size="small" />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>

            <UserModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
            />
        </section>
    );
}
