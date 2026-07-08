import { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, RefreshCw, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function LogViewer() {
    const [logs, setLogs] = useState([]);
    const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING, CONNECTED, DISCONNECTED
    const scrollRef = useRef(null);

    useEffect(() => {
        let ws;
        let reconnectTimer;
        let isMounted = true;

        const connect = () => {
            setWsStatus('CONNECTING');
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Connect to the proxy or direct backend
            ws = new WebSocket(`${protocol}//${window.location.host}/logs`);

            ws.onopen = () => {
                setWsStatus('CONNECTED');
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'INIT_LOGS') {
                        setLogs(message.data);
                    } else if (message.type === 'NEW_LOG') {
                        setLogs(prev => {
                            const newLogs = [...prev, message.data];
                            return newLogs.slice(-1000); // keep last 1000
                        });
                    }
                } catch (err) {
                    console.error('Failed to parse WS message', err);
                }
            };

            ws.onclose = () => {
                if (!isMounted) return;
                setWsStatus('DISCONNECTED');
                // Reconnect after 3 seconds
                reconnectTimer = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
            };
        };

        connect();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimer);
            if (ws) ws.close();
        };
    }, []);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const clearLogs = async () => {
        try {
            await fetch('/api/logs', { method: 'DELETE' });
            setLogs([]);
        } catch (err) {
            console.error('Failed to clear logs on server', err);
        }
    };

    const refreshLogs = () => {
        // A simple page reload is the most robust way to restart the WS and fetch INIT_LOGS
        // But if we want to do it in-place without page reload, we can clear and fetch /api/logs manually,
        // or just let the reconnect logic handle it. For now, since logs are stateful on server, we can
        // just close the WS to trigger a reconnect if it's not connected, or we can add a specific refresh endpoint.
        window.location.reload();
    };

    const getIcon = (level) => {
        switch (level) {
            case 'INFO': return <Info className="size-4 text-blue-500" />;
            case 'SUCCESS': return <CheckCircle className="size-4 text-emerald-500" />;
            case 'WARNING': return <AlertTriangle className="size-4 text-amber-500" />;
            case 'ERROR': return <XCircle className="size-4 text-red-500" />;
            default: return <Terminal className="size-4 text-muted" />;
        }
    };

    const getBadgeStyle = (level) => {
        switch (level) {
            case 'INFO': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'SUCCESS': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'WARNING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'ERROR': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-surface-hover text-muted border-border';
        }
    };

    return (
        <div className="flex flex-col h-full bg-background font-mono text-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
                <div className="flex items-center gap-3">
                    <Terminal className="size-5 text-muted" />
                    <span className="font-bold text-main font-heading tracking-wide">Live Logs</span>
                    <div className="flex items-center gap-1.5 ml-4">
                        <div className={`size-2.5 rounded-full ${wsStatus === 'CONNECTED' ? 'bg-success-text' : wsStatus === 'CONNECTING' ? 'bg-warning-text animate-pulse' : 'bg-error-text'}`} />
                        <span className="text-xs font-bold text-muted uppercase">{wsStatus}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={refreshLogs} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border border-border bg-surface-hover text-muted hover:text-main hover:bg-accent/10 hover:border-accent/20 transition-all"
                        title="Refresh Connection"
                    >
                        <RefreshCw className="size-3.5" />
                        Refresh
                    </button>
                    <button 
                        onClick={clearLogs} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border border-border bg-surface-hover text-muted hover:text-error hover:bg-error/10 hover:border-error/20 transition-all"
                        title="Clear Logs"
                    >
                        <Trash2 className="size-3.5" />
                        Clear
                    </button>
                </div>
            </div>

            {/* Log Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-1.5 scroll-smooth"
            >
                {logs.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted italic">
                        No logs to display yet.
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 hover:bg-surface-hover/70 p-2 -mx-2 rounded transition-colors group">
                            <span className="text-muted shrink-0 tabular-nums text-xs mt-0.5">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                            </span>
                            <div className="shrink-0">
                                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${getBadgeStyle(log.level)}`}>
                                    {getIcon(log.level)}
                                    {log.level}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                                <span className={`text-sm break-words ${
                                    log.level === 'ERROR' ? 'text-red-400' :
                                    log.level === 'WARNING' ? 'text-amber-400' :
                                    log.level === 'SUCCESS' ? 'text-emerald-400' : 'text-main'
                                }`}>
                                    {log.message}
                                </span>
                                {log.context && (
                                    <span className="text-[10px] font-mono text-muted/70 uppercase truncate">{log.context}</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
