
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  FileText, 
  BookOpen, 
  Edit3, 
  Send, 
  MessageSquare, 
  Save, 
  Loader2, 
  AlertCircle, 
  Download, 
  Sparkles, 
  ArrowRight, 
  Maximize2, 
  Minimize2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Columns,
  Eye,
  Type,
  Code,
  Minus,
  Table as TableIcon,
  Undo2,
  Redo2,
  Plus,
  ChevronDown,
  Type as TypeIcon,
  Workflow
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import TurndownService from 'turndown';
// @ts-ignore
import { gfm } from 'turndown-plugin-gfm';
import mermaid from 'mermaid';

import { AIChatMessage } from './types';
import { geminiService } from './services/geminiService';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#e0e7ff',
    primaryTextColor: '#1e1b4b',
    primaryBorderColor: '#818cf8',
    lineColor: '#6366f1',
    secondaryColor: '#f5f3ff',
    tertiaryColor: '#ffffff',
  },
  securityLevel: 'loose',
});

// Initialize Turndown for HTML -> Markdown conversion with GFM plugin for tables
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*'
});
turndownService.use(gfm);

// Custom Turndown rule to handle Mermaid code blocks in visual editor
turndownService.addRule('mermaid', {
  filter: (node) => {
    return node.nodeName === 'PRE' && node.classList.contains('mermaid');
  },
  replacement: (content) => {
    return `\n\`\`\`mermaid\n${content.trim()}\n\`\`\`\n`;
  }
});

// --- Helper Components ---

const MermaidChart: React.FC<{ chart: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart.trim()) return;
      try {
        const { svg } = await mermaid.render(id.current, chart);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        setSvg('<div class="p-4 bg-red-50 text-red-500 rounded-lg text-xs font-mono">Invalid Flowchart Syntax</div>');
      }
    };
    renderChart();
  }, [chart]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center my-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden" 
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <div className="prose prose-slate prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-blue-600 prose-pre:bg-slate-900 prose-pre:rounded-2xl prose-pre:shadow-2xl prose-img:rounded-3xl prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-1 prose-blockquote:px-6">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      code(props) {
        const { children, className, node, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');
        const lang = match ? match[1] : '';
        
        if (lang === 'mermaid') {
          return <MermaidChart chart={String(children)} />;
        }

        return match ? (
          <SyntaxHighlighter 
            {...(rest as any)} 
            PreTag="div" 
            children={String(children).replace(/\n$/, '')} 
            language={match[1]} 
            style={vscDarkPlus as any} 
            className="rounded-2xl !bg-slate-900 text-xs sm:text-sm shadow-2xl p-6 !m-0" 
          />
        ) : (
          <code {...rest} className={`${className} bg-slate-100 px-1.5 py-0.5 rounded text-blue-600 font-bold`}>{children}</code>
        );
      }
    }}>
      {content}
    </ReactMarkdown>
  </div>
);

// --- Main App Component ---

const FONT_FAMILIES = [
  { name: 'Inter (Sans)', value: "'Inter', sans-serif" },
  { name: 'Georgia (Serif)', value: "Georgia, serif" },
  { name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { name: 'System', value: "system-ui, sans-serif" },
];

const FONT_SIZES = [
  { name: 'Small', value: '16px' },
  { name: 'Normal', value: '18px' },
  { name: 'Medium', value: '20px' },
  { name: 'Large', value: '24px' },
  { name: 'Extra Large', value: '32px' },
];

export default function App() {
  const [docName, setDocName] = useState('Untitled Document');
  const [fileContent, setFileContent] = useState('# Welcome to Lumina\n\nLumina is your distraction-free AI markdown workspace.\n\n## Features\n- **Visual Editing**: Edit directly on the preview surface.\n- **Docs-like editing**: A focused, paper-centered writing experience.\n- **AI Intelligence**: Summarize, rewrite, and analyze with Gemini 3 Pro.\n- **Live Preview**: Switch between Write and Read modes instantly.\n\n## Example Flowchart\n\n\`\`\`mermaid\ngraph TD;\n    A[Start Editing] --> B{Choose Mode};\n    B -->|Visual| C[Direct WYSIWYG];\n    B -->|Source| D[Markdown Code];\n    C --> E[Export MD];\n    D --> E;\n\`\`\`\n\n| Item | Description | Status |\n| :--- | :--- | :--- |\n| Table Support | Now available | Done |\n| Flowcharts | Mermaid.js powered | Active |\n\n*Start editing this text visually or ask the AI for help!*');
  const [viewMode, setViewMode] = useState<'read' | 'edit' | 'split' | 'visual'>('visual');
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<AIChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Font settings
  const [editorFont, setEditorFont] = useState(FONT_FAMILIES[0].value);
  const [editorFontSize, setEditorFontSize] = useState(FONT_SIZES[1].value);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Initial load into visual editor
  useEffect(() => {
    if (viewMode === 'visual' && visualEditorRef.current) {
      const htmlContent = marked.parse(fileContent) as string;
      if (visualEditorRef.current.innerHTML !== htmlContent) {
        visualEditorRef.current.innerHTML = htmlContent;
      }
    }
  }, [viewMode]);

  // Sync external changes
  useEffect(() => {
    if (viewMode === 'visual' && visualEditorRef.current && !isInternalChange.current) {
        const htmlContent = marked.parse(fileContent) as string;
        if (visualEditorRef.current.innerHTML !== htmlContent) {
            visualEditorRef.current.innerHTML = htmlContent;
        }
    }
    isInternalChange.current = false;
  }, [fileContent, viewMode]);

  const handleExport = () => {
    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docName.trim() || 'Untitled'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyFormatting = (command: string, value?: string) => {
    if (viewMode === 'visual') {
        visualEditorRef.current?.focus();
        
        if (command === 'formatBlock') {
          const currentBlock = document.queryCommandValue('formatBlock').toLowerCase();
          const targetBlock = value?.toLowerCase();
          
          if (currentBlock === targetBlock || currentBlock === `<${targetBlock}>`) {
            document.execCommand('formatBlock', false, 'p');
          } else {
            document.execCommand('formatBlock', false, value);
          }
        } else if (command === 'createLink') {
          const url = prompt('Enter the link URL:');
          if (url) {
            document.execCommand('createLink', false, url);
          }
        } else if (command === 'insertTable') {
          const tableHtml = `
            <table>
              <thead>
                <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>
              </thead>
              <tbody>
                <tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr>
                <tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr>
              </tbody>
            </table>
            <p><br></p>
          `;
          document.execCommand('insertHTML', false, tableHtml);
        } else if (command === 'insertFlowchart') {
          const flowchartHtml = `
            <pre class="mermaid">
graph TD;
    A[Start] --> B[Process];
    B --> C{Decision};
    C -->|Yes| D[Result 1];
    C -->|No| E[Result 2];
            </pre>
            <p><br></p>
          `;
          document.execCommand('insertHTML', false, flowchartHtml);
        } else if (command === 'addTableRow') {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const closestTable = (range.startContainer as HTMLElement).closest?.('table') || 
                                 (range.startContainer.parentElement as HTMLElement).closest('table');
            
            if (closestTable) {
              const tbody = closestTable.querySelector('tbody') || closestTable;
              const rowCount = (closestTable.querySelector('tr') as HTMLTableRowElement).cells.length;
              const newRow = document.createElement('tr');
              for (let i = 0; i < rowCount; i++) {
                const td = document.createElement('td');
                td.innerHTML = 'New cell';
                newRow.appendChild(td);
              }
              tbody.appendChild(newRow);
            } else {
              setError("Place your cursor inside a table to add a row.");
            }
          }
        } else if (command === 'undo') {
          document.execCommand('undo', false);
        } else if (command === 'redo') {
          document.execCommand('redo', false);
        } else {
          document.execCommand(command, false, value);
        }
        
        handleVisualInput(); 
        return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const map: Record<string, [string, string]> = {
        bold: ['**', '**'],
        italic: ['*', '*'],
        underline: ['<u>', '</u>'],
        formatBlockH1: ['\n# ', ''],
        formatBlockH2: ['\n## ', ''],
        insertHorizontalRule: ['\n---\n', ''],
        insertTable: ['\n| Header | Header |\n| :--- | :--- |\n| Cell | Cell |\n', ''],
        blockquote: ['\n> ', ''],
        insertFlowchart: ['\n\`\`\`mermaid\ngraph TD;\n    A-->B;\n\`\`\`\n', ''],
    };
    
    const [prefix, suffix] = map[command] || ['',''];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = fileContent.substring(start, end);
    const textToInsert = selectedText || "text";
    const before = fileContent.substring(0, start);
    const after = fileContent.substring(end);
    setFileContent(`${before}${prefix}${textToInsert}${suffix}${after}`);
  };

  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      isInternalChange.current = true;
      const html = visualEditorRef.current.innerHTML;
      const markdown = turndownService.turndown(html);
      setFileContent(markdown);
    }
  };

  const handleChat = async (e?: React.FormEvent, overridePrompt?: string) => {
    e?.preventDefault();
    const prompt = overridePrompt || chatInput;
    if (!prompt.trim()) return;

    const userMsg: AIChatMessage = {
      role: 'user',
      text: prompt,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!overridePrompt) setChatInput('');
    setIsAiLoading(true);

    try {
      const response = await geminiService.chat(
        userMsg.text, 
        fileContent,
        chatMessages.map(m => ({ role: m.role, text: m.text }))
      );
      
      setChatMessages(prev => [...prev, { role: 'model', text: response, timestamp: Date.now() }]);
    } catch (err: any) {
      setError('AI service failed. Please check your network or API configuration.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    handleChat(undefined, prompt);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden relative">
      
      {/* AI Sidebar Overlay */}
      {isAISidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 transition-opacity"
          onClick={() => setIsAISidebarOpen(false)}
        />
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative z-10 overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-slate-200 bg-white shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-900/10 shrink-0">L</div>
            <div className="flex flex-col min-w-0">
              <input 
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 truncate max-w-[120px] sm:max-w-[300px]"
                placeholder="Name your document..."
              />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Autosaved Locally</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button onClick={() => setViewMode('visual')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'visual' ? 'bg-white text-purple-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                <Eye size={16} />
                <span className="hidden lg:inline text-xs">Visual</span>
              </button>
              <button onClick={() => setViewMode('edit')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                <Edit3 size={16} />
                <span className="hidden lg:inline text-xs">Source</span>
              </button>
              <button onClick={() => setViewMode('split')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'split' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                <Columns size={16} />
                <span className="hidden lg:inline text-xs">Split</span>
              </button>
              <button onClick={() => setViewMode('read')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${viewMode === 'read' ? 'bg-white text-blue-600 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'}`}>
                <BookOpen size={16} />
                <span className="hidden lg:inline text-xs">Read</span>
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

            <div className="flex items-center gap-1">
              <button onClick={handleExport} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Export Markdown"><Download size={20} /></button>
              <button 
                onClick={() => setIsAISidebarOpen(!isAISidebarOpen)} 
                className={`p-2.5 rounded-xl transition-all shadow-sm ${isAISidebarOpen ? 'bg-purple-100 text-purple-600' : 'bg-white border border-slate-200 text-slate-400 hover:text-purple-600 hover:border-purple-200'}`}
              >
                <MessageSquare size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Container */}
        <div className="flex-1 overflow-hidden relative bg-white">
          <div className="h-full flex flex-col overflow-hidden">
            
            {/* Toolbar for Visual Editor */}
            {viewMode === 'visual' && (
              <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 sm:px-10 gap-1 shrink-0 z-20 shadow-sm overflow-x-auto no-scrollbar relative">
                <div className="flex items-center gap-0.5 mr-2 shrink-0">
                  <button onClick={() => applyFormatting('undo')} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Undo"><Undo2 size={18} /></button>
                  <button onClick={() => applyFormatting('redo')} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Redo"><Redo2 size={18} /></button>
                </div>
                
                <div className="w-px h-6 bg-slate-200 mx-2 shrink-0"></div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => applyFormatting('bold')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Bold"><Bold size={18} /></button>
                  <button onClick={() => applyFormatting('italic')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Italic"><Italic size={18} /></button>
                  <button onClick={() => applyFormatting('underline')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Underline"><Underline size={18} /></button>
                </div>
                
                <div className="w-px h-8 bg-slate-200 mx-3 shrink-0"></div>
                
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => applyFormatting('formatBlock', 'h1')} className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Heading 1">
                    <Heading1 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">H1</span>
                  </button>
                  <button onClick={() => applyFormatting('formatBlock', 'h2')} className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Heading 2">
                    <Heading2 size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">H2</span>
                  </button>
                </div>
                
                <div className="w-px h-8 bg-slate-200 mx-3 shrink-0"></div>
                
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => applyFormatting('insertUnorderedList')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Unordered List"><List size={18} /></button>
                  <button onClick={() => applyFormatting('insertOrderedList')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Ordered List"><ListOrdered size={18} /></button>
                </div>
                
                <div className="w-px h-8 bg-slate-200 mx-3 shrink-0"></div>
                
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => applyFormatting('formatBlock', 'blockquote')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Blockquote (Markdown style)"><Quote size={18} /></button>
                  <button onClick={() => applyFormatting('insertHorizontalRule')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Horizontal Divider"><Minus size={18} /></button>
                  <button onClick={() => applyFormatting('createLink')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Insert Link"><LinkIcon size={18} /></button>
                  <button onClick={() => applyFormatting('formatBlock', 'pre')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Code Block"><Code size={18} /></button>
                  <button onClick={() => applyFormatting('insertFlowchart')} className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-1" title="Insert Mermaid Flowchart">
                    <Workflow size={18} />
                    <span className="text-[10px] font-bold uppercase">Chart</span>
                  </button>
                </div>
                
                <div className="w-px h-8 bg-slate-200 mx-3 shrink-0"></div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => applyFormatting('insertTable')} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Insert Table"><TableIcon size={18} /></button>
                  <button onClick={() => applyFormatting('addTableRow')} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center gap-1" title="Add Row to Selected Table">
                    <Plus size={16} />
                    <span className="text-[10px] font-bold uppercase">Row</span>
                  </button>
                </div>

                <div className="w-px h-8 bg-slate-200 mx-3 shrink-0"></div>

                {/* Typography Settings */}
                <div className="relative shrink-0 pr-4">
                  <button 
                    onClick={() => setIsFontMenuOpen(!isFontMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 bg-slate-50 shadow-sm"
                    title="Typography Settings"
                  >
                    <TypeIcon size={18} />
                    <span className="text-[10px] font-black uppercase tracking-tight">Font Settings</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFontMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Font Family</label>
                          <div className="grid grid-cols-1 gap-1">
                            {FONT_FAMILIES.map((font) => (
                              <button
                                key={font.value}
                                onClick={() => { setEditorFont(font.value); }}
                                className={`text-left px-3 py-2 rounded-lg text-sm transition-all ${editorFont === font.value ? 'bg-purple-50 text-purple-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                style={{ fontFamily: font.value }}
                              >
                                {font.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-3">Font Size</label>
                          <div className="flex flex-wrap gap-1">
                            {FONT_SIZES.map((size) => (
                              <button
                                key={size.value}
                                onClick={() => { setEditorFontSize(size.value); }}
                                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${editorFontSize === size.value ? 'bg-purple-600 text-white font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                              >
                                {size.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {viewMode === 'visual' ? (
                <div 
                  className="min-h-full w-full max-w-screen-xl mx-auto px-6 sm:px-20 py-12 animate-in fade-in duration-500 relative"
                  onClick={() => isFontMenuOpen && setIsFontMenuOpen(false)}
                >
                   <div className="absolute top-4 left-6 flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest pointer-events-none z-10">
                     <Eye size={12} />
                     Visual Editor
                   </div>
                   <div 
                     ref={visualEditorRef}
                     contentEditable
                     onInput={handleVisualInput}
                     style={{ 
                       fontFamily: editorFont,
                       fontSize: editorFontSize,
                       lineHeight: 1.6
                     }}
                     className="prose prose-slate prose-lg max-w-none prose-editable focus:outline-none min-h-[calc(100vh-180px)] pb-32"
                     spellCheck={false}
                   />
                </div>
              ) : viewMode === 'edit' ? (
                <div className="h-full w-full bg-slate-50 flex flex-col p-4 sm:p-8">
                   <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                      <div className="h-12 bg-white border-b border-slate-100 flex items-center px-6 gap-2 shrink-0">
                         <button onClick={() => applyFormatting('bold')} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg" title="Bold"><Bold size={16} /></button>
                         <button onClick={() => applyFormatting('italic')} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg" title="Italic"><Italic size={16} /></button>
                         <button onClick={() => applyFormatting('blockquote')} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg" title="Blockquote"><Quote size={16} /></button>
                         <button onClick={() => applyFormatting('insertFlowchart')} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg" title="Insert Flowchart"><Workflow size={16} /></button>
                      </div>
                      <textarea 
                        ref={textareaRef}
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        className="flex-1 p-8 sm:p-12 text-slate-800 mono text-base leading-relaxed resize-none focus:outline-none placeholder:text-slate-200"
                        placeholder="Edit Markdown source..."
                        spellCheck={false}
                      />
                   </div>
                </div>
              ) : viewMode === 'split' ? (
                <div className="h-full flex overflow-hidden">
                  <div className="flex-1 border-r border-slate-200 flex flex-col bg-slate-50 p-4">
                    <textarea 
                      ref={textareaRef}
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      className="flex-1 p-8 bg-white border border-slate-200 rounded-2xl text-slate-800 mono text-sm leading-relaxed resize-none focus:outline-none scrollbar-thin shadow-sm"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto p-12 bg-white scrollbar-thin">
                    <MarkdownRenderer content={fileContent} />
                  </div>
                </div>
              ) : (
                <div className="min-h-full w-full max-w-screen-xl mx-auto px-6 sm:px-20 py-12">
                   <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100">
                      <MarkdownRenderer content={fileContent} />
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* --- AI Sidebar --- */}
      <aside className={`${isAISidebarOpen ? 'translate-x-0 w-80 sm:w-[420px]' : 'translate-x-full w-0'} fixed right-0 top-0 h-full transition-all duration-300 ease-in-out bg-white border-l border-slate-200 flex flex-col z-40 overflow-hidden shadow-2xl`}>
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-200"><Sparkles size={24} /></div>
            <div>
              <h3 className="font-black text-slate-800 tracking-tight leading-none mb-1.5 text-sm sm:text-base">Lumina AI</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Gemini 3 Pro Intelligence</p>
            </div>
          </div>
          <button onClick={() => setIsAISidebarOpen(false)} className="text-slate-300 hover:text-slate-600 p-2.5 rounded-full hover:bg-slate-50 transition-all"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin bg-slate-50/20">
            {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-400 mb-8 shadow-inner"><MessageSquare size={36} /></div>
                    <p className="text-lg font-bold text-slate-800 mb-3 tracking-tight">Writing Partner</p>
                    <p className="text-sm text-slate-400 mb-10 max-w-[240px] leading-relaxed">I can help draft content, summarize your work, or review for technical clarity.</p>
                    <div className="space-y-3 w-full max-w-[280px]">
                        {["Summarize this doc", "Review tone and clarity", "Generate section outline"].map((text, i) => (
                          <button key={i} onClick={() => handleQuickAction(text)} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-left text-xs font-bold text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md transition-all flex items-center gap-4 group">
                            <span className="w-2 h-2 bg-purple-400 rounded-full group-hover:scale-150 transition-transform"></span>
                            {text}
                            <ArrowRight size={14} className="ml-auto text-slate-200 group-hover:text-purple-400 transition-all" />
                          </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 pb-6">
                  {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`max-w-[92%] p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white font-medium' : 'bg-white border border-slate-100 text-slate-800 shadow-slate-200/40'}`}>
                              <div className={`prose prose-xs sm:prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-slate'}`}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                              </div>
                              <div className={`mt-3 text-[9px] uppercase tracking-[0.2em] font-black opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.role === 'user' ? 'Author' : 'Assistant'}
                              </div>
                          </div>
                      </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center gap-4 text-slate-400 text-xs shadow-sm"><Loader2 size={18} className="animate-spin text-purple-600" /> Thinking...</div>
                    </div>
                  )}
                </div>
            )}
        </div>

        <div className="p-6 sm:p-8 border-t border-slate-100 bg-white shrink-0">
          <form onSubmit={handleChat} className="relative group">
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask Lumina anything..." className="w-full pl-6 pr-16 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all font-medium" />
            <button type="submit" disabled={!chatInput.trim() || isAiLoading} className="absolute right-3 top-3 p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-20 transition-all shadow-lg shadow-purple-200 active:scale-95"><Send size={20} /></button>
          </form>
        </div>
      </aside>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900 text-white px-8 py-5 rounded-2xl shadow-2xl z-[120] animate-in slide-in-from-bottom-8 duration-500 max-w-[90%] sm:w-auto border border-white/10">
          <AlertCircle size={22} className="text-red-400 shrink-0" />
          <span className="text-sm font-bold opacity-90">{error}</span>
          <button onClick={() => setError(null)} className="ml-8 p-1.5 hover:bg-white/10 rounded-full transition-all"><X size={18} /></button>
        </div>
      )}
    </div>
  );
}
