import { ChevronRight } from 'lucide-react';

// ==============================================================================
// SECTION 1: BREADCRUMBS
// ==============================================================================

export const Breadcrumb = ({ segments = [], className = '' }) => {
    return (
        <div className={`flex items-center gap-2 text-sm font-medium capitalize text-muted ${className}`}>
            {segments.length === 0 ? (
                <span className="text-main">Home</span>
            ) : (
                segments.map((segment, index) => {
                    const isLast = index === segments.length - 1;
                    return (
                        <div key={segment} className="flex items-center gap-2">
                            {index > 0 && <ChevronRight className="size-4 shrink-0 text-border" />}
                            <span className={isLast ? 'text-main' : 'text-muted'}>{segment}</span>
                        </div>
                    );
                })
            )}
        </div>
    );
};
