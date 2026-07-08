import { useState, useEffect } from 'react';
import { BrainCircuit, Download, RefreshCw, CheckCircle, Database } from 'lucide-react';

export default function ModelManager({ onOllamaStatus }) {
    const [models, setModels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pullInput, setPullInput] = useState('');
    const [activePull, setActivePull] = useState(null); // { modelName, progress, total, completed }

    const fetchModels = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/models');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setModels(data.models || []);
            if (onOllamaStatus) onOllamaStatus('ONLINE');
        } catch (err) {
            console.error(err);
            if (onOllamaStatus) onOllamaStatus('OFFLINE');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModels();
        
        // Setup WebSocket listener specifically for MODEL_PROGRESS
        let ws;
        const connectWs = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(`${protocol}//${window.location.host}/logs`);
            
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'MODEL_PROGRESS') {
                        const { modelName, progress } = message.data;
                        setActivePull({
                            modelName,
                            status: progress.status,
                            total: progress.total || 0,
                            completed: progress.completed || 0
                        });
                        
                        if (progress.status === 'success') {
                            setTimeout(() => {
                                setActivePull(null);
                                fetchModels();
                            }, 2000);
                        }
                    }
                } catch (e) {
                    // Ignore
                }
            };
            
            ws.onclose = () => setTimeout(connectWs, 3000);
        };
        
        connectWs();
        return () => { if (ws) ws.close(); };
    }, []);

    const handlePull = async (e) => {
        e.preventDefault();
        if (!pullInput.trim() || activePull) return;

        const modelToPull = pullInput.trim();
        setActivePull({ modelName: modelToPull, status: 'Initializing...', total: 100, completed: 0 });
        setPullInput('');

        try {
            await fetch('/api/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelName: modelToPull })
            });
        } catch (err) {
            console.error('Failed to initiate pull', err);
            setActivePull(null);
        }
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="size-5 text-accent" />
                    <span className="font-bold text-main font-heading tracking-wide">AI Models</span>
                </div>
                <button 
                    onClick={fetchModels}
                    disabled={isLoading}
                    className="p-1.5 rounded bg-surface border border-border text-muted hover:text-main hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                
                {/* Pull New Model */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wide">Install New Model</h3>
                    <form onSubmit={handlePull} className="flex gap-2">
                        <input
                            type="text"
                            value={pullInput}
                            onChange={(e) => setPullInput(e.target.value)}
                            disabled={activePull !== null}
                            placeholder="e.g. llama3, mistral"
                            className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-main placeholder-muted focus:outline-none focus:border-accent"
                        />
                        <button
                            type="submit"
                            disabled={!pullInput.trim() || activePull !== null}
                            className="bg-accent text-surface font-bold text-sm px-4 rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download className="size-4" />
                            Pull
                        </button>
                    </form>
                    
                    {/* Progress Bar */}
                    {activePull && (
                        <div className="flex flex-col gap-2 p-3 rounded-md border border-border bg-surface-hover">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-main">Downloading {activePull.modelName}...</span>
                                <span className="text-muted">{activePull.status}</span>
                            </div>
                            <div className="h-2 w-full bg-surface rounded-full overflow-hidden border border-border">
                                <div 
                                    className="h-full bg-accent transition-all duration-300 ease-out" 
                                    style={{ width: `${activePull.total > 0 ? (activePull.completed / activePull.total) * 100 : 0}%` }}
                                />
                            </div>
                            {activePull.total > 0 && (
                                <div className="flex justify-between text-xs text-muted font-mono">
                                    <span>{formatBytes(activePull.completed)}</span>
                                    <span>{formatBytes(activePull.total)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Installed Models */}
                <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wide">Installed Models ({models.length})</h3>
                    {models.length === 0 ? (
                        <div className="text-sm text-muted italic p-4 border border-dashed border-border rounded-lg text-center">
                            No models installed on this server.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {models.map(model => (
                                <div key={model.digest} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface hover:border-accent/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Database className="size-5 text-muted" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-main text-sm">{model.name}</span>
                                            <span className="text-xs text-muted font-mono">{formatBytes(model.size)}</span>
                                        </div>
                                    </div>
                                    <button className="text-xs font-bold uppercase text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20 flex items-center gap-1">
                                        <CheckCircle className="size-3" /> Ready
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
