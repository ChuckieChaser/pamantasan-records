// File: src/components/ui/Menu.jsx
import { useState } from 'react';
import { Bell, MoreVertical } from 'lucide-react';

import { IconButton, MenuButton } from './Buttons';
import { TransparentBackdrop } from './Backdrops';
import { MenuContainer, MenuHeader, MenuBody } from './Containers';

// 1. NOTIFICATION MENU (For the Topbar)
export const NotificationMenu = ({ hasUnread = false, notifications = [], className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => setIsOpen(false);

    const isEmpty = notifications.length === 0;

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <IconButton icon={Bell} size="medium" active={isOpen} onClick={handleToggle} />
                {hasUnread && <span className="absolute top-2 right-2 size-2 rounded-full bg-error-text" />}
            </div>

            {isOpen && (
                <>
                    <TransparentBackdrop onClick={handleClose} />

                    <MenuContainer className="top-full right-0 w-80">
                        <MenuHeader title="Notifications" />

                        <MenuBody className="max-h-80">
                            {isEmpty ? (
                                <div className="p-4 text-center text-sm text-muted">No new notifications.</div>
                            ) : (
                                notifications.map((notif, index) => (
                                    <MenuButton
                                        key={index}
                                        label={notif.title}
                                        description={notif.message}
                                        onClick={() => {
                                            if (notif.onClick) notif.onClick();
                                            handleClose();
                                        }}
                                    >
                                        {notif.time && <span className="mt-1 text-xs text-muted opacity-70">{notif.time}</span>}
                                    </MenuButton>
                                ))
                            )}
                        </MenuBody>
                    </MenuContainer>
                </>
            )}
        </div>
    );
};

export const ActionMenu = ({ options = [], size = 'medium', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleClose = () => setIsOpen(false);

    return (
        <div className={`relative ${className}`}>
            <IconButton icon={MoreVertical} size={size} active={isOpen} onClick={handleToggle} />

            {isOpen && (
                <>
                    <TransparentBackdrop onClick={handleClose} />

                    <MenuContainer className="top-full right-0 w-48 p-1">
                        {options.map((option, index) => (
                            <MenuButton
                                key={index}
                                icon={option.icon}
                                label={option.label}
                                destructive={option.destructive}
                                onClick={() => {
                                    if (option.onClick) option.onClick();
                                    handleClose();
                                }}
                            />
                        ))}
                    </MenuContainer>
                </>
            )}
        </div>
    );
};
