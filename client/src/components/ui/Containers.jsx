// ==============================================================================
// SECTION 1: CARD — Top-level container
// ==============================================================================

// ==============================================================================
// SECTION 1: CARD — Top-level container
// ==============================================================================

// ==============================================================================
// SECTION 1: CARD — Container
// ==============================================================================

// --- Card: container rule → rounded-lg, sm shadow, no padding (children control it) ---
export const Card = ({ className = '', children, ...props }) => {
    return (
        <div className={`flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-shadow duration-200 ${className}`} {...props}>
            {children}
        </div>
    );
};

// --- CardHeader: first child container → p-4 ---
export const CardHeader = ({ title, description, action, className = '', ...props }) => {
    return (
        <div className={`flex shrink-0 items-center justify-between border-b border-border p-4 ${className}`} {...props}>
            <div className="flex flex-col gap-1">
                {title && <h3 className="font-bold text-main">{title}</h3>}
                {description && <p className="text-xs text-muted">{description}</p>}
            </div>

            {action && <div className="shrink-0 pl-2">{action}</div>}
        </div>
    );
};

// --- CardBody: first child container → p-4 ---
export const CardBody = ({ padded = false, className = '', children, ...props }) => {
    const paddingClass = padded ? 'p-4' : '';

    return (
        <div className={`flex-1 ${paddingClass} ${className}`} {...props}>
            {children}
        </div>
    );
};

// --- CardFooter: first child container → p-4 ---
export const CardFooter = ({ className = '', children, ...props }) => {
    return (
        <div className={`flex shrink-0 items-center justify-end gap-2 border-t border-border bg-surface p-4 ${className}`} {...props}>
            {children}
        </div>
    );
};

// ==============================================================================
// SECTION 2: MENU CONTAINER — Floating container
// ==============================================================================

// --- MenuContainer: container → rounded-lg, shadow-lg, no padding ---
export const MenuContainer = ({ className = '', children, ...props }) => {
    return (
        <div className={`absolute z-50 mt-2 flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg ${className}`} {...props}>
            {children}
        </div>
    );
};

// --- MenuHeader: first child container → p-4 ---
export const MenuHeader = ({ title, className = '', children, ...props }) => {
    return (
        <div className={`border-b border-border p-4 text-sm font-bold text-main ${className}`} {...props}>
            {title || children}
        </div>
    );
};

// --- MenuBody: first child container → p-4 ---
export const MenuBody = ({ className = '', children, ...props }) => {
    return (
        <div className={`flex flex-col overflow-y-auto p-4 ${className}`} {...props}>
            {children}
        </div>
    );
};
