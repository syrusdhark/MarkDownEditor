import React, { useState } from 'react';
import { FileText, Plus, Trash2, X, MoreVertical } from 'lucide-react';
import { WorkspaceFile } from '../types';

interface FileSidebarProps {
    files: WorkspaceFile[];
    activeFileId: string;
    onFileSelect: (id: string) => void;
    onFileCreate: () => void;
    onFileDelete: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const FileSidebar: React.FC<FileSidebarProps> = ({
    files,
    activeFileId,
    onFileSelect,
    onFileCreate,
    onFileDelete,
    isOpen,
    onClose,
}) => {
    const [hoveredFileId, setHoveredFileId] = useState<string | null>(null);

    // Don't modify the DOM if closed, just hide via CSS translation or width
    // But for cleaner React tree, we might handle visibility in parent or here

    return (
        <div
            className={`fixed left-0 top-0 h-full bg-slate-50 border-r border-slate-200 z-50 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64 translate-x-0 shadow-2xl' : 'w-0 -translate-x-full opacity-0'
                }`}
        >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <h2 className="font-bold text-slate-800 text-sm tracking-tight">Workspace</h2>
                <button
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="p-3">
                <button
                    onClick={onFileCreate}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
                >
                    <Plus size={16} />
                    <span>New File</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {files.map((file) => (
                    <div
                        key={file.id}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeFileId === file.id
                                ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                            }`}
                        onClick={() => onFileSelect(file.id)}
                        onMouseEnter={() => setHoveredFileId(file.id)}
                        onMouseLeave={() => setHoveredFileId(null)}
                    >
                        <FileText size={16} className={`shrink-0 ${activeFileId === file.id ? 'text-blue-500' : 'text-slate-400'}`} />
                        <span className="text-xs font-medium truncate flex-1">{file.name}</span>

                        {(hoveredFileId === file.id || activeFileId === file.id) && files.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete ${file.name}?`)) {
                                        onFileDelete(file.id);
                                    }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete file"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-medium text-center">
                {files.length} file{files.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
};
