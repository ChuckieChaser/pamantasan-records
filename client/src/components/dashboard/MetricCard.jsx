import { Card, CardBody } from '../ui/Containers';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// ==============================================================================
// SECTION 1: THEME MAP
// ==============================================================================

const THEME_CLASSES = {
    accent: {
        text: 'text-accent',
        bg: 'bg-accent-background',
    },
    warning: {
        text: 'text-warning-text',
        bg: 'bg-warning-background',
    },
    error: {
        text: 'text-error-text',
        bg: 'bg-error-background',
    },
    success: {
        text: 'text-success-text',
        bg: 'bg-success-background',
    },
};

// ==============================================================================
// SECTION 2: COMPONENT
// ==============================================================================

export default function MetricCard({ title, value, icon: Icon, colorTheme = 'accent', to = '#' }) {
    const colors = THEME_CLASSES[colorTheme] ?? THEME_CLASSES.accent;

    return (
        <Card className="h-full transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
            <CardBody className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-xs font-bold uppercase tracking-wider text-muted">{title}</span>
                        <span className="text-3xl font-black text-main">{value}</span>
                    </div>
                    <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${colors.bg} ${colors.text}`}>
                        {Icon && <Icon className="size-6" />}
                    </div>
                </div>
                <div className="mt-auto flex items-center pt-4">
                    <Link to={to} className={`flex items-center gap-1 text-xs font-bold ${colors.text} transition-colors hover:opacity-80`}>
                        View details <ArrowRight className="size-3" />
                    </Link>
                </div>
            </CardBody>
        </Card>
    );
}
