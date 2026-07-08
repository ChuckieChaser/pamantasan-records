import { BADGE_SIZES } from '../scale';

// ==============================================================================
// SECTION 1: BASE CLASSES
// ==============================================================================

// --- UI action: fixed medium border radius ---
const BASE_BADGE = 'inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors duration-200';

// ==============================================================================
// SECTION 2: VARIANTS
// ==============================================================================

const BADGE_VARIANTS = {
    neutral: 'bg-surface-hover text-muted border border-border',
    success: 'bg-success-background text-success-text border border-success-border',
    warning: 'bg-warning-background text-warning-text border border-warning-border',
    error: 'bg-error-background text-error-text border border-error-border',
};

// ==============================================================================
// SECTION 3: COMPONENTS
// ==============================================================================

export const Badge = ({ label, variant = 'neutral', size = 'medium', className = '', ...props }) => {
    const variantClass = BADGE_VARIANTS[variant] ?? BADGE_VARIANTS.neutral;

    return (
        <span className={`${BASE_BADGE} ${BADGE_SIZES[size]} ${variantClass} ${className}`} {...props}>
            {label}
        </span>
    );
};
