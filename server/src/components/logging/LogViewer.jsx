import { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2, RefreshCw, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function LogViewer() {
    const [logs, setLogs] = useState([]);
    const [wsStatus, setWsStatus] = useState('CONNECTING'); // CONNECTING, CONNECTED, DISCONNECTED
    const scrollRef = useRef(null);

    useEffect(() => {
        let ws;
        let reconnectTimer;

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
                setWsStatus('DISCONNECTED');
                // Reconnect after 3 seconds
                reconnectTimer = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        };

        connect();

        return () => {
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

    const getColor = (level) => {
        switch (level) {
            case 'INFO': return 'text-blue-400';
            case 'SUCCESS': return 'text-emerald-400';
            case 'WARNING': return 'text-amber-400';
            case 'ERROR': return 'text-red-400';
            default: return 'text-main';
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
                        className="p-1.5 rounded bg-surface-hover text-muted hover:text-main hover:bg-accent/10 transition-colors"
                        title="Refresh Connection"
                    >
                        <RefreshCw className="size-4" />
                    </button>
                    <button 
                        onClick={clearLogs} 
                        className="p-1.5 rounded bg-surface-hover text-muted hover:text-error hover:bg-error/10 transition-colors"
                        title="Clear Logs"
                    >
                        <Trash2 className="size-4" />
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
                        <div key={log.id} className="flex items-start gap-3 hover:bg-surface-hover/50 p-1 -mx-1 rounded transition-colors group">
                            <span className="text-muted shrink-0 tabular-nums">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                            </span>
                            <div className="shrink-0 mt-0.5">
                                {getIcon(log.level)}
                            </div>
                            <span className={`shrink-0 font-bold w-20 ${getColor(log.level)}`}>
                                [{log.source}]
                            </span>
                            <span className="text-main break-all whitespace-pre-wrap">
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
