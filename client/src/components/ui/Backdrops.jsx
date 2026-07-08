// --- Shared Base Classes ---
const BASE_BACKDROP_CLASS = 'fixed inset-0 z-40 cursor-default';

// --- Components ---
export const TransparentBackdrop = ({ className = '', ...props }) => {
    return <div className={`${BASE_BACKDROP_CLASS} bg-transparent ${className}`} {...props} />;
};

export const DimBackdrop = ({ className = '', ...props }) => {
    return <div className={`${BASE_BACKDROP_CLASS} bg-black/40 backdrop-blur-sm transition-all duration-300 ${className}`} {...props} />;
};
