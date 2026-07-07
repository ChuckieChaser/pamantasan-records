import { useState, useEffect } from 'react';
import { Settings, Shield, Moon, Bell, Key, History, LogOut } from 'lucide-react';
import { useAuthentication, useUserSetting, useUserCredential, useUserSession } from '../../stores';
import { USER_SETTINGS_THEME, USER_SETTINGS_NOTIFICATION } from '../../constants';
import { Modal, PrimaryButton, SecondaryButton, DestructiveButton, SelectField, PasswordField } from '../ui';

// ==============================================================================
// SECTION 1: SETTINGS MODAL
// ==============================================================================

// ==============================================================================
// SECTION 1: CONSTANTS
// ==============================================================================

const SETTINGS_TABS = Object.freeze({
    PREFERENCE: 'preference',
    SECURITY: 'security',
});

const THEME_OPTIONS = [
    { label: 'System', value: USER_SETTINGS_THEME.SYSTEM },
    { label: 'Light', value: USER_SETTINGS_THEME.LIGHT },
    { label: 'Dark', value: USER_SETTINGS_THEME.DARK },
];

const NOTIFICATION_OPTIONS = [
    { label: 'All', value: USER_SETTINGS_NOTIFICATION.ALL },
    { label: 'System', value: USER_SETTINGS_NOTIFICATION.SYSTEM },
    { label: 'Important', value: USER_SETTINGS_NOTIFICATION.IMPORTANT },
];

const SettingsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState(SETTINGS_TABS.PREFERENCE);

    const { user } = useAuthentication();
    const { userSetting, getByUserId: getSettings, update: updateSettings } = useUserSetting();
    const { userSessions, getByUserId: getSessions } = useUserSession();
    const { getByUserId: getCredentials } = useUserCredential();

    const [credentials, setCredentials] = useState(null);

    useEffect(() => {
        if (isOpen && user?.id) {
            getSettings(user.id);
            getSessions(user.id);
            getCredentials(user.id).then(setCredentials).catch(() => setCredentials(null));
        }
    }, [isOpen, user?.id, getSettings, getSessions, getCredentials]);

    // --- Tab definitions ---
    const TABS = [
        { id: SETTINGS_TABS.PREFERENCE, label: 'Preferences', icon: Settings },
        { id: SETTINGS_TABS.SECURITY, label: 'Security', icon: Shield },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings" className="w-full max-w-4xl h-full max-h-full">
            <div className="flex h-full flex-1 overflow-hidden">
                {/* --- Left Pane: Navigation --- */}
                <div className="w-64 shrink-0 border-r border-border shadow-inner p-4">
                    <nav className="flex flex-col gap-2">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors duration-200 ${isActive
                                        ? 'bg-accent-background text-accent'
                                        : 'text-main hover:bg-surface-hover'
                                        }`}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* --- Right Pane: Content --- */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === SETTINGS_TABS.PREFERENCE && (
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-main">Theme</h3>
                                    <p className="mt-1 text-xs text-muted">Customize the appearance of the application.</p>
                                </div>
                                <div className="w-50 shrink-0">
                                    <SelectField
                                        icon={Moon}
                                        options={THEME_OPTIONS}
                                        value={userSetting?.theme || USER_SETTINGS_THEME.SYSTEM}
                                        onChange={(val) => updateSettings(user.id, { theme: val })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-main">Notifications</h3>
                                    <p className="mt-1 text-xs text-muted">Manage your notification preferences.</p>
                                </div>
                                <div className="w-50 shrink-0">
                                    <SelectField
                                        icon={Bell}
                                        options={NOTIFICATION_OPTIONS}
                                        value={userSetting?.notification || USER_SETTINGS_NOTIFICATION.ALL}
                                        onChange={(val) => updateSettings(user.id, { notification: val })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === SETTINGS_TABS.SECURITY && (
                        <div className="flex flex-col gap-8">
                            <div>
                                <h3 className="text-sm font-bold text-main">Password Reset</h3>
                                <p className="mt-1 text-xs text-muted">Change your account password.</p>
                                <div className="mt-4 flex flex-col gap-4 rounded-md border border-border bg-surface-hover shadow-inner p-4">
                                    <div className="border-b border-border pb-4">
                                        <h4 className="text-sm font-bold text-main">Update Password</h4>
                                        <p className="mt-1 text-xs text-muted">Ensure your account is using a long, random password to stay secure.</p>
                                    </div>
                                    <PasswordField placeholder="Current Password" />
                                    <PasswordField placeholder="New Password" />
                                    <PasswordField placeholder="Confirm Password" />
                                    <div className="flex justify-end pt-2">
                                        <PrimaryButton icon={Key} disabled>Change Password</PrimaryButton>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-main">Single Sign-On</h3>
                                    <p className="mt-1 text-xs text-muted">Connect your account with external providers.</p>
                                    {credentials?.google_id && (
                                        <p className="mt-2 text-xs font-semibold text-accent">Linked Gmail: {user?.email}</p>
                                    )}
                                </div>
                                <div className="shrink-0">
                                    {credentials?.google_id ? (
                                        <DestructiveButton>Unlink Google Account</DestructiveButton>
                                    ) : (
                                        <SecondaryButton>Link Google Account</SecondaryButton>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-main">Session History</h3>
                                        <p className="mt-1 text-xs text-muted">View your recent login activity.</p>
                                    </div>
                                    <DestructiveButton>Sign Out All Sessions</DestructiveButton>
                                </div>
                                <div className="mt-4 flex flex-col gap-2 rounded-md border border-border bg-surface-hover shadow-inner p-4">
                                    {userSessions.length === 0 ? (
                                        <div className="text-sm text-muted">No sessions found.</div>
                                    ) : (
                                        userSessions.map((session, index) => (
                                            <div key={session.id}>
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <History className="size-4 shrink-0 text-muted" />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-main">
                                                                {session.ip_address} • {session.user_agent?.substring(0, 30) || 'Unknown Device'}
                                                            </span>
                                                            <span className="text-xs text-muted">
                                                                {new Date(session.created_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <DestructiveButton icon={LogOut} size="small">Sign Out</DestructiveButton>
                                                </div>
                                                {index < userSessions.length - 1 && <div className="mt-2 h-px w-full bg-border" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default SettingsModal;
