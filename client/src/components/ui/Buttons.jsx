import { UI_SIZES, ICON_SIZES, ICON_BUTTON_SIZES, IMAGE_BUTTON_SIZES, TRACK_SWITCH_SIZES, THUMB_SWITCH_SIZES, THUMB_SWITCH_TRANSLATE } from '../scale';

// ==============================================================================
// SECTION 1: BASE CLASSES
// ==============================================================================

// --- UI actions: fixed medium border radius ---
const BASE_TEXT_BUTTON = 'flex cursor-pointer items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50';
const BASE_ICON_BUTTON = 'flex shrink-0 cursor-pointer items-center justify-center rounded-md transition-all duration-200';

// ==============================================================================
// SECTION 2: COMPONENTS
// ==============================================================================

export const PrimaryButton = ({ icon: Icon, size = 'medium', className = '', children, ...props }) => {
    return (
        <button className={`${BASE_TEXT_BUTTON} ${UI_SIZES[size]} border-accent bg-accent text-surface hover:bg-accent-hover ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
            {children && <span>{children}</span>}
        </button>
    );
};

export const SecondaryButton = ({ icon: Icon, size = 'medium', className = '', children, ...props }) => {
    return (
        <button className={`${BASE_TEXT_BUTTON} ${UI_SIZES[size]} border-border bg-surface text-main hover:bg-surface-hover ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
            {children && <span>{children}</span>}
        </button>
    );
};

export const DestructiveButton = ({ icon: Icon, size = 'medium', className = '', children, ...props }) => {
    return (
        <button className={`${BASE_TEXT_BUTTON} ${UI_SIZES[size]} border-error-border bg-error-background text-error-text hover:border-error-text hover:bg-error-text hover:text-surface ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
            {children && <span>{children}</span>}
        </button>
    );
};

// --- Image Button: rounded-full for avatars/logos ---
export const ImageButton = ({ src, alt, size = 'medium', className = '', ...props }) => {
    return (
        <button className={`${IMAGE_BUTTON_SIZES[size]} shrink-0 cursor-pointer overflow-hidden rounded-full border border-border ${className}`} {...props}>
            {src && <img src={src} alt={alt} className="h-full w-full object-cover" />}
        </button>
    );
};

// --- Icon Button: rounded-md to match UI action rule ---
export const IconButton = ({ icon: Icon, size = 'medium', active = false, className = '', ...props }) => {
    const stateClass = active ? 'bg-accent-background text-accent' : 'bg-transparent text-muted hover:bg-surface-hover hover:text-main';

    return (
        <button className={`${BASE_ICON_BUTTON} ${ICON_BUTTON_SIZES[size]} ${stateClass} ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
        </button>
    );
};

// --- Navigation Button: rounded-md, solid active state ---
export const NavigationButton = ({ icon: Icon, size = 'medium', active = false, className = '', ...props }) => {
    const stateClass = active ? 'bg-accent text-surface' : 'bg-transparent text-muted hover:bg-surface-hover hover:text-main';

    return (
        <button className={`${BASE_ICON_BUTTON} ${ICON_BUTTON_SIZES[size]} ${stateClass} ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
        </button>
    );
};

// --- Switch Button: rounded-full for pill shape ---
export const SwitchButton = ({ size = 'medium', checked = false, className = '', ...props }) => {
    const trackStateClass = checked ? 'bg-accent' : 'bg-border';
    const thumbStateClass = checked ? THUMB_SWITCH_TRANSLATE[size] : 'translate-x-0';

    return (
        <button className={`flex shrink-0 cursor-pointer items-center rounded-full transition-all duration-200 ${TRACK_SWITCH_SIZES[size]} ${trackStateClass} ${className}`} {...props}>
            <span className={`rounded-full bg-surface shadow-sm transition-all duration-200 ${THUMB_SWITCH_SIZES[size]} ${thumbStateClass}`} />
        </button>
    );
};

// --- Menu Button: full-width, left-aligned, for dropdown items ---
export const MenuButton = ({ icon: Icon, label, description, destructive = false, className = '', children, ...props }) => {
    const textColorClass = destructive ? 'text-error-text hover:bg-error-background' : 'text-main hover:bg-surface-hover';

    return (
        <button type="button" className={`flex w-full cursor-pointer items-start gap-2 rounded-md p-2 text-left transition-colors duration-200 ${textColorClass} ${className}`} {...props}>
            {Icon && <Icon className="size-4 shrink-0 self-center justify-self-center text-muted" />}

            <div className="flex flex-col">
                {label && <span className="text-sm font-medium">{label}</span>}
                {description && <span className="text-xs text-muted">{description}</span>}
                {children}
            </div>
        </button>
    );
};
