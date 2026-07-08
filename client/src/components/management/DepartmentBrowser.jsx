import { useState } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Building2, Plus } from 'lucide-react';
import { Card } from '../ui/Containers';
import { InputField } from '../ui/Textfields';
import { PrimaryButton } from '../ui/Buttons';
import DepartmentModal from './DepartmentModal';

// ==============================================================================
// SECTION 1: UTILITIES
// ==============================================================================

const SORT_STATES = Object.freeze(['DEFAULT', 'ASC', 'DESC']);

const renderSortIcon = (col, currentSortCol, currentSortState) => {
    if (currentSortCol !== col || currentSortState === 'DEFAULT') {
        return <ArrowUpDown className="size-3 text-muted" />;
    }
    return currentSortState === 'ASC' ? <ArrowUp className="size-3 text-accent" /> : <ArrowDown className="size-3 text-accent" />;
};

// ==============================================================================
// SECTION 2: COMPONENT
// ==============================================================================

export default function DepartmentBrowser({ title, description, departments, activeDepartmentId, onDepartmentClick }) {
    const [filter, setFilter] = useState('');
    const [sortCol, setSortCol] = useState('NAME');
    const [sortState, setSortState] = useState('ASC');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleSort = (col) => {
        if (sortCol !== col) {
            setSortCol(col);
            setSortState('ASC');
        } else {
            const currentStateIndex = SORT_STATES.indexOf(sortState);
            const safeIndex = currentStateIndex === -1 ? 0 : currentStateIndex;
            const nextIndex = (safeIndex + 1) % SORT_STATES.length;
            setSortState(SORT_STATES[nextIndex]);
        }
    };

    // --- Filtered + sorted departments ---
    const displayDepartments = (() => {
        let result = [...(departments || [])];

        if (filter) {
            result = result.filter(d =>
                d.name.toLowerCase().includes(filter.toLowerCase()) ||
                d.code.toLowerCase().includes(filter.toLowerCase())
            );
        }

        let isSorted = false;
        if (sortState !== 'DEFAULT') {
            isSorted = true;
            if (sortCol === 'NAME') {
                result.sort((a, b) => sortState === 'ASC' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
            } else if (sortCol === 'CODE') {
                result.sort((a, b) => sortState === 'ASC' ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code));
            } else if (sortCol === 'DATE') {
                result.sort((a, b) => sortState === 'ASC' ? new Date(a.updated_at) - new Date(b.updated_at) : new Date(b.updated_at) - new Date(a.updated_at));
            }
        }

        if (!isSorted) {
            result.sort((a, b) => a.name.localeCompare(b.name));
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
                            placeholder={`Search departments...`}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <PrimaryButton icon={Plus} onClick={() => setIsAddModalOpen(true)}>Add Department</PrimaryButton>
                </div>
            </div>

            {/* --- Body --- */}
            <Card className="overflow-hidden">
                <table className="w-full text-left text-sm text-main">
                    <thead className="border-b border-border bg-surface text-xs font-semibold uppercase text-muted">
                        <tr>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('NAME')}>
                                <div className="flex items-center gap-1">Department Name {renderSortIcon('NAME', sortCol, sortState)}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('CODE')}>
                                <div className="flex items-center gap-1">Department Code {renderSortIcon('CODE', sortCol, sortState)}</div>
                            </th>
                            <th className="cursor-pointer px-4 py-3 transition-colors duration-200 hover:text-accent" onClick={() => handleSort('DATE')}>
                                <div className="flex items-center gap-1">Last Updated {renderSortIcon('DATE', sortCol, sortState)}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                        {displayDepartments.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-muted">No departments found.</td>
                            </tr>
                        ) : (
                            displayDepartments.map(dept => {
                                const isSelected = activeDepartmentId === dept.id;
                                return (
                                    <tr
                                        key={dept.id}
                                        className={`cursor-pointer transition-colors duration-200 hover:bg-surface-hover ${isSelected ? 'bg-surface-hover' : ''}`}
                                        onClick={() => onDepartmentClick(dept.id)}
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center justify-center ${isSelected ? 'text-accent' : 'text-muted'}`}>
                                                    <Building2 className="size-4" />
                                                </div>
                                                <span className={`max-w-xs truncate font-bold md:max-w-md ${isSelected ? 'text-accent' : 'text-main'}`}>
                                                    {dept.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-mono text-muted">
                                            {dept.code}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-muted">
                                            {new Date(dept.updated_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </Card>

            <DepartmentModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
            />
        </section>
    );
}
