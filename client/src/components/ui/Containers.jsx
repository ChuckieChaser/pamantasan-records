// --- Components ---
export const Card = ({ className = '', children, ...props }) => {
    return (
        <div className={`flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-300 ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardHeader = ({ title, description, action, className = '', ...props }) => {
    return (
        <div className={`flex shrink-0 items-center justify-between border-b border-border px-6 py-4 ${className}`} {...props}>
            <div className="flex flex-col gap-1">
                {title && <h3 className="font-bold text-main">{title}</h3>}
                {description && <p className="text-sm text-muted">{description}</p>}
            </div>

            {action && <div className="shrink-0 pl-4">{action}</div>}
        </div>
    );
};

export const CardBody = ({ padded = false, className = '', children, ...props }) => {
    const paddingClass = padded ? 'p-6' : '';

    return (
        <div className={`flex-1 ${paddingClass} ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardFooter = ({ className = '', children, ...props }) => {
    return (
        <div className={`flex shrink-0 items-center justify-end gap-4 border-t border-border bg-surface px-6 py-4 ${className}`} {...props}>
            {children}
        </div>
    );
};

// ---

export const MenuContainer = ({ className = '', children, ...props }) => {
    return (
        <div className={`absolute z-50 mt-2 flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-lg ${className}`} {...props}>
            {children}
        </div>
    );
};

export const MenuHeader = ({ title, className = '', children, ...props }) => {
    return (
        <div className={`border-b border-border px-4 py-3 text-sm font-bold text-main ${className}`} {...props}>
            {title || children}
        </div>
    );
};

export const MenuBody = ({ className = '', children, ...props }) => {
    return (
        <div className={`flex flex-col overflow-y-auto p-1.5 ${className}`} {...props}>
            {children}
        </div>
    );
};
