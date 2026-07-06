import { useState } from 'react';
import { Bell, MoreVertical, Settings, LogOut, User } from 'lucide-react';

import { IconButton, ImageButton, MenuButton } from './Buttons';
import { Badge } from './Badges';
import { TransparentBackdrop } from './Backdrops';
import { MenuContainer, MenuHeader, MenuBody } from './Containers';

import SettingsModal from '../layout/SettingsModal';
import ProfileModal from '../layout/ProfileModal';

import avatar from '../../assets/avatar.png';

// ==============================================================================
// SECTION 1: NOTIFICATION MENU
// ==============================================================================

export const NotificationMenu = ({ hasUnread = false, notifications = [], className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => setIsOpen((previous) => !previous);
    const handleClose = () => setIsOpen(false);

    const isEmpty = notifications.length === 0;

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <IconButton icon={Bell} size="medium" active={isOpen} onClick={handleToggle} />

                {/* --- Unread dot: positioned inside the button bounds --- */}
                {hasUnread && (
                    <span className="absolute top-2 right-2 size-2 rounded-full bg-error-text" />
                )}
            </div>

            {isOpen && (
                <>
                    <TransparentBackdrop onClick={handleClose} />

                    <MenuContainer className="top-full right-0 w-96">
                        <MenuHeader title="Notifications" />

                        <MenuBody className="max-h-80">
                            {isEmpty ? (
                                <div className="px-4 py-6 text-center text-sm text-muted">
                                    No new notifications.
                                </div>
                            ) : (
                                notifications.map((notification, index) => (
                                    <MenuButton
                                        key={index}
                                        onClick={() => {
                                            if (notification.onClick) notification.onClick();
                                            handleClose();
                                        }}
                                    >
                                        <div className="flex w-full items-center justify-between gap-4">
                                            {/* Left side: Avatar + Information */}
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 shrink-0 overflow-hidden rounded-full border border-border">
                                                    <img src={notification.avatar || avatar} alt="Actor" className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    {notification.title && <span className="text-sm font-medium">{notification.title}</span>}
                                                    {notification.message && <span className="text-xs text-muted">{notification.message}</span>}
                                                    {notification.time && <span className="mt-1 text-xs text-muted">{notification.time}</span>}
                                                </div>
                                            </div>

                                            {/* Right side: Interaction count */}
                                            {notification.count > 1 && (
                                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-surface">
                                                    {notification.count}
                                                </div>
                                            )}
                                        </div>
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

// ==============================================================================
// SECTION 2: ACTION MENU (Three-dot dropdown)
// ==============================================================================

export const ActionMenu = ({ options = [], size = 'medium', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => setIsOpen((previous) => !previous);
    const handleClose = () => setIsOpen(false);

    return (
        <div className={`relative ${className}`}>
            <IconButton icon={MoreVertical} size={size} active={isOpen} onClick={handleToggle} />

            {isOpen && (
                <>
                    <TransparentBackdrop onClick={handleClose} />

                    {/* Action menu uses MenuBody as the child container for consistent p-4 padding */}
                    <MenuContainer className="top-full right-0 w-48">
                        <MenuBody>
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
                        </MenuBody>
                    </MenuContainer>
                </>
            )}
        </div>
    );
};

// ==============================================================================
// SECTION 3: USER MENU
// ==============================================================================

export const UserMenu = ({ user, onLogout, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleToggle = () => setIsOpen((previous) => !previous);
    const handleClose = () => setIsOpen(false);

    return (
        <div className={`relative ${className}`}>
            <ImageButton
                src={user?.avatar_path || avatar}
                alt={user ? `${user.first_name} profile` : 'Profile'}
                size="medium"
                onClick={handleToggle}
            />

            {isOpen && (
                <>
                    <TransparentBackdrop onClick={handleClose} />

                    <MenuContainer className="left-full bottom-0 ml-2 w-72">
                        <MenuHeader>
                            <div className="flex items-center gap-3">
                                <ImageButton src={user?.avatar_path || avatar} alt="Profile" size="large" />
                                <div className="flex flex-col">
                                    <span className="font-bold text-main">{user?.first_name} {user?.last_name}</span>
                                    <span className="text-xs text-muted">{user?.email}</span>
                                    <Badge label={user?.role} variant="neutral" size="small" className="mt-1 w-max" />
                                </div>
                            </div>
                        </MenuHeader>

                        <MenuBody>
                            <MenuButton
                                icon={User}
                                label="Profile"
                                onClick={() => {
                                    setIsProfileOpen(true);
                                    handleClose();
                                }}
                            />
                            <MenuButton
                                icon={Settings}
                                label="Settings"
                                onClick={() => {
                                    setIsSettingsOpen(true);
                                    handleClose();
                                }}
                            />
                            <MenuButton
                                icon={LogOut}
                                label="Logout"
                                destructive={true}
                                onClick={() => {
                                    if (onLogout) onLogout();
                                    handleClose();
                                }}
                            />
                        </MenuBody>
                    </MenuContainer>
                </>
            )}

            {/* --- Modals --- */}
            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};
