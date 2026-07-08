import { useState, useEffect, useRef } from 'react';
import { Server, Database, BrainCircuit, Activity, Monitor } from 'lucide-react';
import LogViewer from '../logging/LogViewer';
import ModelManager from '../ai/ModelManager';

export default function DashboardLayout() {
    const [status, setStatus] = useState({ postgres: false, ollama: false, client: false });
    const failCountRef = useRef(0);

    useEffect(() => {
        const fetchStatus = async () => {
            if (failCountRef.current >= 3) return; // Stop polling if failed too many times

            try {
                const res = await fetch('/api/status');
                if (res.ok) {
                    const data = await res.json();
                    setStatus(data);
                    failCountRef.current = 0; // Reset fail count on success
                } else {
                    throw new Error('API down');
                }
            } catch (err) {
                failCountRef.current += 1;
                setStatus({ postgres: false, ollama: false, client: false });
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 15000); // 15 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-main">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full">
                {/* Header */}
                <header className="h-16 shrink-0 border-b border-border bg-surface flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/10 text-accent rounded-lg">
                            <Server className="size-5" />
                        </div>
                        <h1 className="text-lg font-bold font-heading tracking-wide">Server Node Hub</h1>
                    </div>

                    {/* Global Status Indicators */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Database className="size-4 text-muted" />
                            <span className="text-sm font-medium text-main">Postgres</span>
                            <div className={`size-2 rounded-full ${status.postgres ? 'bg-success-text' : 'bg-error-text'}`} />
                        </div>
                        <div className="flex items-center gap-2">
                            <BrainCircuit className="size-4 text-muted" />
                            <span className="text-sm font-medium text-main">Ollama</span>
                            <div className={`size-2 rounded-full ${status.ollama ? 'bg-success-text' : 'bg-error-text'}`} />
                        </div>
                        <div className="flex items-center gap-2 pl-4 border-l border-border">
                            <Monitor className="size-4 text-muted" />
                            <span className="text-sm font-medium text-main">Client</span>
                            <div className={`size-2 rounded-full ${status.client ? 'bg-success-text' : 'bg-error-text'}`} />
                        </div>
                    </div>
                </header>

                {/* 2-Pane Content Grid */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    
                    {/* Left Pane: Log Viewer (60% width roughly, col-span-7) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 border-r border-border">
                        <LogViewer />
                    </div>

                    {/* Right Pane: Model Manager & Actions (40% width roughly, col-span-5) */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0 bg-surface">
                        <ModelManager />
                    </div>
                    
                </div>
            </main>
        </div>
    );
}
