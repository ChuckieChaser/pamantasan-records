import { ChevronRight } from 'lucide-react';

// ==============================================================================
// SECTION 1: BREADCRUMBS
// ==============================================================================

export const Breadcrumb = ({ segments = [], className = '' }) => {
    return (
        <div className={`flex items-center gap-2 text-sm font-medium text-muted ${className}`}>
            {segments.length === 0 ? (
                <span className="text-main capitalize">Home</span>
            ) : (
                segments.map((segment, index) => {
                    const isLast = index === segments.length - 1;
                    const label = typeof segment === 'string' ? segment : segment.label;
                    const onClick = typeof segment === 'string' ? undefined : segment.onClick;
                    
                    return (
                        <div key={`${label}-${index}`} className="flex items-center gap-2">
                            {index > 0 && <ChevronRight className="size-4 shrink-0 text-border" />}
                            {onClick && !isLast ? (
                                <button
                                    onClick={onClick}
                                    className="hover:text-accent transition-colors capitalize"
                                >
                                    {label}
                                </button>
                            ) : (
                                <span className={`${isLast ? 'text-main' : 'text-muted'} capitalize`}>
                                    {label}
                                </span>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};
