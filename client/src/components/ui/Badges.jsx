import { BADGE_SIZES } from '../scale';

// --- Shared Base Classes ---
const BASE_BADGE_CLASS = 'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors duration-300';

// --- Domain Specific Variants ---
const BADGE_VARIANTS = {
    neutral: 'bg-surface-hover text-muted border border-border',
    success: 'bg-success-background text-success-text border border-success-border',
    warning: 'bg-warning-background text-warning-text border border-warning-border',
    error: 'bg-error-background text-error-text border border-error-border',
};

// --- Components ---
export const Badge = ({ label, variant = 'neutral', size = 'medium', className = '', ...props }) => {
    const variantClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral;

    return (
        <span className={`${BASE_BADGE_CLASS} ${BADGE_SIZES[size]} ${variantClass} ${className}`} {...props}>
            {label}
        </span>
    );
};
