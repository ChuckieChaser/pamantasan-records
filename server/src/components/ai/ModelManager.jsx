import { useState, useEffect } from 'react';
import { BrainCircuit, Search, Download, Trash2, ExternalLink, CheckCircle, Database, X, AlertTriangle } from 'lucide-react';

const CATALOG = [
    { name: 'llama3.1', display: 'Llama 3.1', params: '8B', context: '128K', desc: 'Highly proficient in text summarization, reasoning, and instruction following.' },
    { name: 'llama3.2-vision', display: 'Llama 3.2 Vision', params: '11B', context: '128K', desc: 'Multimodal model excellent at understanding images and summarizing visual text.' },
    { name: 'mistral', display: 'Mistral', params: '7B', context: '8K', desc: 'Fast, highly capable model excellent for concise and accurate summarization.' },
    { name: 'phi3', display: 'Phi-3 Mini', params: '3.8B', context: '128K', desc: 'Lightweight, high-quality model perfect for summarizing on low resources.' },
    { name: 'gemma2', display: 'Gemma 2', params: '9B', context: '8K', desc: 'Google\'s high-performing model with strong reasoning and summarizing abilities.' },
    { name: 'qwen2', display: 'Qwen 2', params: '7B', context: '32K', desc: 'Alibaba\'s highly multilingual model, great at summarizing cross-lingual content.' },
    { name: 'llava', display: 'LLaVA', params: '7B', context: '4K', desc: 'Vision-language model capable of understanding and summarizing complex images.' },
    { name: 'moondream', display: 'Moondream 2', params: '1.8B', context: '4K', desc: 'Tiny, highly efficient vision model for extracting info from images.' },
];

export default function ModelManager({ onOllamaStatus }) {
    const [installedModels, setInstalledModels] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activePulls, setActivePulls] = useState({}); // { [modelName]: { status, total, completed } }
    const [customPull, setCustomPull] = useState('');
    const [activeModel, setActiveModel] = useState(() => localStorage.getItem('activeModel') || '');

    useEffect(() => {
        if (activeModel) {
            localStorage.setItem('activeModel', activeModel);
        }
    }, [activeModel]);

    const fetchModels = async () => {
        try {
            const res = await fetch('/api/models');
            if (res.ok) {
                const data = await res.json();
                setInstalledModels(data.models || []);
                if (onOllamaStatus) onOllamaStatus('ONLINE');
            }
        } catch (err) {
            console.error('Failed to fetch installed models', err);
            if (onOllamaStatus) onOllamaStatus('OFFLINE');
        }
    };

    useEffect(() => {
        fetchModels();
        
        let ws;
        const connectWs = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(`${protocol}//${window.location.host}/logs`);
            
            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'MODEL_PROGRESS') {
                        const { modelName, progress } = message.data;
                        
                        if (progress.status === 'success' || progress.status === 'cancelled' || progress.status === 'error') {
                            // On completion/failure, remove from active pulls and refresh models
                            setActivePulls(prev => {
                                const next = { ...prev };
                                delete next[modelName];
                                return next;
                            });
                            if (progress.status === 'success') {
                                setTimeout(fetchModels, 1000);
                            }
                        } else {
                            // Update progress
                            setActivePulls(prev => ({
                                ...prev,
                                [modelName]: {
                                    status: progress.status,
                                    total: progress.total || prev[modelName]?.total || 0,
                                    completed: progress.completed || prev[modelName]?.completed || 0
                                }
                            }));
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

    const handlePull = async (modelName) => {
        if (!modelName.trim() || activePulls[modelName]) return;
        
        setActivePulls(prev => ({
            ...prev,
            [modelName]: { status: 'Initializing...', total: 100, completed: 0 }
        }));
        
        if (modelName === customPull) setCustomPull('');
        
        try {
            await fetch('/api/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelName })
            });
        } catch (err) {
            console.error('Failed to initiate pull', err);
            setActivePulls(prev => {
                const next = { ...prev };
                delete next[modelName];
                return next;
            });
        }
    };

    const handleCancelPull = async (modelName) => {
        try {
            await fetch('/api/pull/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelName })
            });
        } catch (err) {
            console.error('Failed to cancel pull', err);
        }
    };

    const handleDelete = async (modelName) => {
        if (!confirm(`Are you sure you want to delete ${modelName}?`)) return;
        try {
            await fetch('/api/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelName })
            });
            fetchModels();
            if (activeModel === modelName) {
                setActiveModel('');
            }
        } catch (err) {
            console.error('Failed to delete model', err);
        }
    };

    const filteredCatalog = CATALOG.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.display.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isInstalled = (name) => installedModels.some(m => m.name === name || m.name === `${name}:latest`);

    const renderDownloadButton = (modelName) => {
        const activePullState = activePulls[modelName];
        const isPulling = !!activePullState;
        const installed = isInstalled(modelName);

        if (installed && !isPulling) {
            return (
                <button onClick={() => handleDelete(modelName)} className="p-2 rounded-full border border-border text-muted hover:text-error hover:border-error hover:bg-error/10 transition-colors" title="Delete Model">
                    <Trash2 className="size-4" />
                </button>
            );
        }

        if (isPulling) {
            const percentage = activePullState.total > 0 ? (activePullState.completed / activePullState.total) * 100 : 0;
            const radius = 14;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (percentage / 100) * circumference;

            return (
                <button onClick={() => handleCancelPull(modelName)} className="relative size-8 flex items-center justify-center group cursor-pointer" title="Cancel Download">
                    <svg className="absolute inset-0 size-full rotate-[-90deg]">
                        <circle cx="16" cy="16" r={radius} className="stroke-border fill-none" strokeWidth="2" />
                        <circle 
                            cx="16" 
                            cy="16" 
                            r={radius} 
                            className="stroke-success fill-none transition-all duration-300 ease-out" 
                            strokeWidth="2"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                        />
                    </svg>
                    <Download className="size-3 text-success animate-pulse group-hover:hidden" />
                    <X className="size-3 text-error hidden group-hover:block" />
                </button>
            );
        }

        return (
            <button 
                onClick={() => handlePull(modelName)} 
                className="p-2 rounded-full border border-border text-muted hover:text-accent hover:border-accent hover:bg-accent/10 transition-colors" 
                title="Download Model"
            >
                <Download className="size-4" />
            </button>
        );
    };

    return (
        <div className="flex flex-col h-full bg-surface text-main">
            {/* Top Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border bg-surface shrink-0">
                <BrainCircuit className="size-5 text-accent" />
                <span className="font-bold font-heading tracking-wide">Model Manager</span>
            </div>

            {/* Active Model Banner */}
            <div className="p-6 border-b border-border bg-gradient-to-r from-surface to-surface-hover shrink-0 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">Active System Model</span>
                    {activeModel ? (
                        <div className="flex items-center gap-3">
                            <CheckCircle className="size-5 text-success drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                            <span className="text-xl font-bold font-heading text-main tracking-wide">{activeModel}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mt-1 px-3 py-1 bg-error/10 border border-error/20 rounded-md w-fit">
                            <AlertTriangle className="size-4 text-error" />
                            <span className="text-sm font-bold text-error">No model selected</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-border shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
                    <input 
                        type="text" 
                        placeholder="Search Ollama Hub catalog..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm font-medium focus:outline-none focus:border-accent placeholder-muted transition-colors"
                    />
                </div>
            </div>

            {/* Catalog List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {filteredCatalog.map(model => (
                    <div key={model.name} className={`p-4 rounded-lg border ${activeModel === model.name ? 'border-success bg-success/5' : 'border-border bg-background'} transition-colors flex flex-col gap-3`}>
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="font-bold text-main">{model.display}</span>
                                <span className="text-xs text-muted font-mono">{model.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {isInstalled(model.name) && activeModel !== model.name && (
                                    <button 
                                        onClick={() => setActiveModel(model.name)}
                                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-surface-hover border border-border rounded hover:bg-success hover:text-surface hover:border-success transition-colors"
                                    >
                                        Set Active
                                    </button>
                                )}
                                <a 
                                    href={`https://ollama.com/library/${model.name.split(':')[0]}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full border border-border text-muted hover:text-main hover:bg-surface-hover transition-colors"
                                    title="View on Ollama Hub"
                                >
                                    <ExternalLink className="size-4" />
                                </a>
                                {renderDownloadButton(model.name)}
                            </div>
                        </div>
                        <p className="text-xs text-muted">{model.desc}</p>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-surface-hover border border-border rounded text-muted">
                                {model.params} Params
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-surface-hover border border-border rounded text-muted">
                                {model.context} Context
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Pull Action */}
            <div className="p-4 border-t border-border shrink-0 flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-muted">Pull Custom Tag</span>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={customPull}
                        onChange={(e) => setCustomPull(e.target.value)}
                        placeholder="e.g. gemma2:2b"
                        className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:border-accent placeholder-muted"
                    />
                    <button 
                        onClick={() => handlePull(customPull)}
                        disabled={!customPull.trim() || activePull !== null}
                        className="bg-accent hover:bg-accent-hover text-surface px-4 rounded-md font-bold text-sm transition-colors disabled:opacity-50"
                    >
                        Pull
                    </button>
                </div>
            </div>
        </div>
    );
}
