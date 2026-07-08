import { useState, useEffect } from 'react';
import { Terminal, Settings, Server, Database, BrainCircuit, Activity } from 'lucide-react';
import LogViewer from '../logging/LogViewer';
import ModelManager from '../ai/ModelManager';

export default function DashboardLayout() {
    const [activeTab, setActiveTab] = useState('DASHBOARD');
    const [serverStatus, setServerStatus] = useState({
        api: 'ONLINE',
        db: 'DISCONNECTED',
        ollama: 'DISCONNECTED'
    });

    useEffect(() => {
        // Simple health check polling
        const checkHealth = async () => {
            try {
                const res = await fetch('/api/health');
                if (res.ok) {
                    setServerStatus(prev => ({ ...prev, api: 'ONLINE' }));
                }
            } catch (err) {
                setServerStatus(prev => ({ ...prev, api: 'OFFLINE' }));
            }
        };

        const interval = setInterval(checkHealth, 5000);
        checkHealth();
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen w-full bg-background text-main overflow-hidden font-body">
            
            {/* Sidebar / Navigation */}
            <aside className="w-16 md:w-64 flex-shrink-0 border-r border-border bg-surface flex flex-col transition-all duration-300">
                <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-border">
                    <Server className="size-6 text-accent" />
                    <span className="hidden md:block ml-3 font-heading font-bold text-lg tracking-wide text-main truncate">
                        P-RECORDS HUB
                    </span>
                </div>
                
                <nav className="flex-1 py-4 flex flex-col gap-2 px-2 md:px-4">
                    <button 
                        onClick={() => setActiveTab('DASHBOARD')}
                        className={`flex items-center p-3 rounded-lg transition-colors ${activeTab === 'DASHBOARD' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                    >
                        <Activity className="size-5 flex-shrink-0" />
                        <span className="hidden md:block ml-3 font-semibold text-sm">Live Dashboard</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('MODELS')}
                        className={`flex items-center p-3 rounded-lg transition-colors ${activeTab === 'MODELS' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                    >
                        <BrainCircuit className="size-5 flex-shrink-0" />
                        <span className="hidden md:block ml-3 font-semibold text-sm">AI Management</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('DATABASE')}
                        className={`flex items-center p-3 rounded-lg transition-colors ${activeTab === 'DATABASE' ? 'bg-accent/10 text-accent border border-accent/20' : 'text-muted hover:bg-surface-hover hover:text-main'}`}
                    >
                        <Database className="size-5 flex-shrink-0" />
                        <span className="hidden md:block ml-3 font-semibold text-sm">Database</span>
                    </button>
                </nav>

                {/* Status Indicators */}
                <div className="p-4 border-t border-border hidden md:flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                        <span className="text-muted flex items-center gap-2"><Server className="size-3.5"/> Hub API</span>
                        <span className={serverStatus.api === 'ONLINE' ? 'text-success-text' : 'text-error-text'}>{serverStatus.api}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                        <span className="text-muted flex items-center gap-2"><Database className="size-3.5"/> Postgres</span>
                        <span className={serverStatus.db === 'ONLINE' ? 'text-success-text' : 'text-error-text'}>{serverStatus.db}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                        <span className="text-muted flex items-center gap-2"><BrainCircuit className="size-3.5"/> Ollama</span>
                        <span className={serverStatus.ollama === 'ONLINE' ? 'text-success-text' : 'text-muted'}>{serverStatus.ollama}</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area (2-pane split) */}
            <main className="flex-1 flex flex-col overflow-hidden bg-background">
                {/* Header */}
                <header className="h-16 flex items-center px-6 border-b border-border bg-surface shrink-0 justify-between">
                    <h1 className="font-heading font-bold text-xl text-main capitalize">{activeTab.toLowerCase().replace('_', ' ')}</h1>
                    <button className="p-2 rounded-md hover:bg-surface-hover text-muted hover:text-main transition-colors">
                        <Settings className="size-5" />
                    </button>
                </header>
                
                {/* 2-Pane Content */}
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 gap-4">
                    {/* Left Pane: Logging (Takes more space) */}
                    <div className="flex-[2] min-w-0 bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <LogViewer />
                    </div>

                    {/* Right Pane: Tools / Management */}
                    <div className="flex-[1] min-w-[320px] bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <ModelManager onOllamaStatus={(status) => setServerStatus(prev => ({...prev, ollama: status}))} />
                    </div>
                </div>
            </main>
        </div>
    );
}
