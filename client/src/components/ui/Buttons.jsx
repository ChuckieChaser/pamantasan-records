import { UI_SIZES, ICON_SIZES, ICON_BUTTON_SIZES, TRACK_SWITCH_SIZES, THUMB_SWITCH_SIZES, THUMB_SWITCH_TRANSLATE } from '../scale';

// --- Shared Base Classes ---
const BASE_TEXT_BUTTON_CLASS = 'flex cursor-pointer items-center justify-center gap-2 rounded-md border font-medium whitespace-nowrap transition-all duration-300';
const BASE_ICON_BUTTON_CLASS = 'flex shrink-0 cursor-pointer items-center justify-center transition-all duration-300';

// --- Components ---
export const PrimaryButton = ({ icon: Icon, size = 'medium', className = '', children, ...props }) => {
    return (
        <button className={`${BASE_TEXT_BUTTON_CLASS} ${UI_SIZES[size]} border-accent bg-accent text-surface hover:bg-accent-hover ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
            {children && <span>{children}</span>}
        </button>
    );
};

export const SecondaryButton = ({ icon: Icon, size = 'medium', className = '', children, ...props }) => {
    return (
        <button className={`${BASE_TEXT_BUTTON_CLASS} ${UI_SIZES[size]} border-border bg-surface text-main hover:bg-surface-hover ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
            {children && <span>{children}</span>}
        </button>
    );
};

export const DestructiveButton = ({ icon: Icon, size = 'medium', className = '', children, ...props }) => {
    return (
        <button className={`${BASE_TEXT_BUTTON_CLASS} ${UI_SIZES[size]} border-error-background bg-error-background text-error-text hover:border-error-text hover:bg-error-text hover:text-surface ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
            {children && <span>{children}</span>}
        </button>
    );
};

export const ImageButton = ({ src, alt, size = 'medium', className = '', ...props }) => {
    return (
        <button className={`${ICON_BUTTON_SIZES[size]} shrink-0 cursor-pointer overflow-hidden rounded-full border border-border ${className}`} {...props}>
            {src && <img src={src} alt={alt} className="h-full w-full object-cover" />}
        </button>
    );
};

export const IconButton = ({ icon: Icon, size = 'medium', active = false, className = '', ...props }) => {
    const stateClass = active ? 'bg-accent-background text-accent' : 'bg-transparent text-muted hover:bg-surface-hover hover:text-main';

    return (
        <button className={`${BASE_ICON_BUTTON_CLASS} ${ICON_BUTTON_SIZES[size]} rounded-full ${stateClass} ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
        </button>
    );
};

export const NavigationButton = ({ icon: Icon, size = 'medium', active = false, className = '', ...props }) => {
    const stateClass = active ? 'bg-accent text-surface' : 'bg-transparent text-muted hover:bg-surface-hover hover:text-main';

    return (
        <button className={`${BASE_ICON_BUTTON_CLASS} ${ICON_BUTTON_SIZES[size]} rounded-md ${stateClass} ${className}`} {...props}>
            {Icon && <Icon className={`${ICON_SIZES[size]} shrink-0`} />}
        </button>
    );
};

export const SwitchButton = ({ size = 'medium', checked = false, className = '', ...props }) => {
    const trackStateClass = checked ? 'bg-accent' : 'bg-border';
    const thumbStateClass = checked ? THUMB_SWITCH_TRANSLATE[size] : 'translate-x-0';

    return (
        <button className={`flex shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ${TRACK_SWITCH_SIZES[size]} ${trackStateClass} ${className}`} {...props}>
            <span className={`rounded-full bg-surface shadow-sm transition-all duration-300 ${THUMB_SWITCH_SIZES[size]} ${thumbStateClass}`} />
        </button>
    );
};
