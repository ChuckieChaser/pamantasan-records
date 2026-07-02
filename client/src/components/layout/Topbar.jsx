import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IconButton, InputField, TransparentBackdrop } from '../ui';

import { Search, Bell, PanelRight, ChevronRight } from 'lucide-react';

const Topbar = ({ onToggleInspector, isInspectorOpen }) => {
    const location = useLocation();

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const pathSegments = location.pathname.split('/').filter((segment) => segment !== '');

    return (
        <header className="flex h-16 w-full shrink-0 items-center justify-between px-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted capitalize">
                {pathSegments.length === 0 ? (
                    <span className="text-main">Home</span>
                ) : (
                    pathSegments.map((segment, index) => {
                        const isLast = index === pathSegments.length - 1;
                        return (
                            <div key={segment} className="flex items-center gap-2">
                                {index > 0 && <ChevronRight className="size-4 shrink-0" />}
                                <span className={isLast ? 'text-main' : 'text-muted'}>{segment}</span>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="w-80">
                    <InputField leftIcon={Search} placeholder="Search anything..." />
                </div>

                <div className="relative">
                    <IconButton icon={Bell} size="medium" active={isNotificationsOpen} onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} />

                    {isNotificationsOpen && (
                        <>
                            <TransparentBackdrop onClick={() => setIsNotificationsOpen(false)} />

                            <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-md border border-border bg-surface shadow-lg">
                                <div className="border-b border-border p-4 text-sm font-bold text-main">Notifications</div>
                                <div className="flex flex-col p-2 text-sm text-muted">
                                    <div className="cursor-pointer rounded-md p-3 transition-colors hover:bg-surface-hover hover:text-main">No new notifications.</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <IconButton icon={PanelRight} size="medium" active={isInspectorOpen} onClick={onToggleInspector} />
            </div>
        </header>
    );
};

export default Topbar;
