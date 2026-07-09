import { useState } from 'react';
import { Bell, MoreVertical, Settings, LogOut, User, Filter } from 'lucide-react';

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

                        <MenuBody className="max-h-96">
                            {isEmpty ? (
                                <div className="px-4 py-8 text-center text-sm text-muted">
                                    No new notifications.
                                </div>
                            ) : (
                                notifications.map((notification, index) => (
                                    <MenuButton
                                        key={index}
                                        className={`mb-1 border-l-4 ${!notification.is_read ? 'border-accent bg-accent-background/30 hover:bg-accent-background/50' : 'border-transparent hover:bg-surface-hover'}`}
                                        onClick={() => {
                                            if (notification.onClick) notification.onClick();
                                            handleClose();
                                        }}
                                    >
                                        <div className="flex w-full items-start justify-between gap-3">
                                            {/* Left side: Avatar + Information */}
                                            <div className="flex flex-1 items-start gap-3">
                                                <div className="mt-0.5 size-10 shrink-0 overflow-hidden rounded-full border border-border shadow-sm">
                                                    <img src={notification.avatar || avatar} alt="Actor" className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex flex-col gap-1 pr-2">
                                                    {notification.title && <span className="text-sm font-medium leading-snug">{notification.title}</span>}
                                                    {notification.message && <span className="text-xs text-muted leading-snug">{notification.message}</span>}
                                                    {notification.time && <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{notification.time}</span>}
                                                </div>
                                            </div>

                                            {/* Right side: Interaction count */}
                                            {notification.count > 1 && (
                                                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-surface shadow-sm">
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

// ==============================================================================
// SECTION 4: FILTER MENU
// ==============================================================================

export const FilterMenu = ({ groups = [], className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => setIsOpen((previous) => !previous);
    const handleClose = () => setIsOpen(false);

    const hasActiveFilters = groups.some(group => group.selected.length > 0);
    const gridCols = groups.length === 2 ? 'grid-cols-2' : groups.length >= 3 ? 'grid-cols-3' : 'grid-cols-1';
    const widthClass = groups.length === 2 ? 'w-96' : groups.length >= 3 ? 'w-[42rem]' : 'w-56';

    return (
        <div className={`relative ${className}`}>
            <IconButton icon={Filter} size="medium" onClick={handleToggle} active={hasActiveFilters || isOpen} />
            {isOpen && (
                <>
                    <TransparentBackdrop onClick={handleClose} />
                    <MenuContainer className={`right-0 top-full mt-2 ${widthClass}`}>
                        <MenuBody className={`grid ${gridCols} max-h-80 gap-6 p-4`}>
                            {groups.map((group, groupIdx) => (
                                <div key={groupIdx} className="flex flex-col gap-1">
                                    <span className="px-2 text-xs font-bold uppercase text-muted">{group.title}</span>
                                    <div className="flex flex-col">
                                        {group.options.map((option) => (
                                            <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-surface-hover">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-border text-accent focus:ring-accent"
                                                    checked={group.selected.includes(option.value)}
                                                    onChange={() => group.onToggle(option.value)}
                                                />
                                                <span className="text-sm font-medium text-main">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </MenuBody>
                    </MenuContainer>
                </>
            )}
        </div>
    );
};
