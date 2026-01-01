import React, { useState, useEffect } from 'react';
import { X, Github, Folder, FileText, ArrowLeft, Loader2, Search, Key } from 'lucide-react';
import { githubService, GitHubFile } from '../services/githubService';

interface GitHubImportModalProps {
    onClose: () => void;
    onImport: (content: string, filename: string) => void;
}

export const GitHubImportModal: React.FC<GitHubImportModalProps> = ({ onClose, onImport }) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [token, setToken] = useState('');
    const [path, setPath] = useState('');
    const [files, setFiles] = useState<GitHubFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentRepo, setCurrentRepo] = useState<{ owner: string, name: string } | null>(null);

    const parseRepoUrl = (url: string) => {
        // Handle formats: "owner/repo" or "https://github.com/owner/repo"
        const cleanUrl = url.replace('https://github.com/', '').replace(/\/$/, '');
        const parts = cleanUrl.split('/');
        if (parts.length >= 2) {
            return { owner: parts[0], name: parts[1] };
        }
        return null;
    };

    const fetchContents = async (repoPath: string) => {
        if (!currentRepo) return;

        setIsLoading(true);
        setError(null);
        try {
            const data = await githubService.getRepoContents(currentRepo.owner, currentRepo.name, repoPath, token);

            // Sort: Directories first, then files
            const sortedData = data.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'dir' ? -1 : 1;
            });

            setFiles(sortedData);
            setPath(repoPath);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch repository contents');
            setFiles([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnect = async () => {
        const repoDetails = parseRepoUrl(repoUrl);
        if (!repoDetails) {
            setError('Invalid repository format. Use "owner/repo" or full URL.');
            return;
        }
        setCurrentRepo(repoDetails);
        // Needed to set currentRepo state before fetching, but setState is async. 
        // So we pass details directly for the first fetch or use a useEffect on currentRepo?
        // Let's just call fetch directly with the parsed details for the initial load.

        setIsLoading(true);
        setError(null);
        try {
            const data = await githubService.getRepoContents(repoDetails.owner, repoDetails.name, '', token);
            const sortedData = data.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'dir' ? -1 : 1;
            });
            setFiles(sortedData);
            setPath('');
        } catch (err: any) {
            setError(err.message || 'Failed to connect to repository');
            setFiles([]);
            setCurrentRepo(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileClick = async (file: GitHubFile) => {
        if (file.type === 'dir') {
            fetchContents(file.path);
        } else {
            // Check if markdown
            if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
                if (!window.confirm('This file does not appear to be Markdown. Import anyway?')) {
                    return;
                }
            }

            setIsLoading(true);
            try {
                const content = await githubService.getFileContent(file.download_url);
                onImport(content, file.name);
                onClose();
            } catch (err: any) {
                setError('Failed to fetch file content');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleNavigateUp = () => {
        if (!path) return;
        const parts = path.split('/');
        parts.pop();
        fetchContents(parts.join('/'));
    };

    const currentPathDisplay = currentRepo ? `/${currentRepo.owner}/${currentRepo.name}/${path}` : '';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
                            <Github size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-tight">Import from GitHub</h2>
                            <p className="text-xs text-slate-500 font-medium">Browse and load markdown files</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 p-4 md:p-6 gap-4">

                    {/* Connection Form */}
                    {!currentRepo && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Repository URL</label>
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        value={repoUrl}
                                        onChange={(e) => setRepoUrl(e.target.value)}
                                        placeholder="e.g. facebook/react"
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
                                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Access Token <span className="text-slate-400 font-normal normal-case">(Optional, for private repos)</span>
                                </label>
                                <div className="relative">
                                    <Key size={16} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="password"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="ghp_..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleConnect}
                                disabled={isLoading || !repoUrl.trim()}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Github size={16} />}
                                Access Repository
                            </button>
                        </div>
                    )}

                    {/* Repo Browser */}
                    {currentRepo && (
                        <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4">
                            <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => {
                                        if (path) handleNavigateUp();
                                        else {
                                            setCurrentRepo(null);
                                            setFiles([]);
                                            setPath('');
                                        }
                                    }}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                                    title={path ? "Go up" : "Change repo"}
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                <div className="h-4 w-px bg-slate-200" />
                                <span className="text-xs font-mono text-slate-600 truncate flex-1 block">
                                    {currentRepo.owner} / {currentRepo.name} {path ? `/ ${path}` : ''}
                                </span>
                            </div>

                            {isLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Loader2 size={32} className="animate-spin text-blue-500" />
                                    <span className="text-xs font-medium">Fetching contents...</span>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-sm">
                                    {files.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                            <Folder size={32} className="mb-2 opacity-20" />
                                            <span className="text-sm">Empty directory</span>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {files.map((file) => (
                                                <button
                                                    key={file.sha}
                                                    onClick={() => handleFileClick(file)}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left transition-colors group"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${file.type === 'dir' ? 'bg-indigo-50 text-indigo-500' : 'bg-slate-100 text-slate-500'}`}>
                                                        {file.type === 'dir' ? <Folder size={16} /> : <FileText size={16} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">{file.name}</p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {file.type === 'dir' ? 'Folder' : `${(file.size / 1024).toFixed(1)} KB`}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
