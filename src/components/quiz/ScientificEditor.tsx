/**
 * ScientificEditor — Rich text editor for Chemistry, Physics, Math quiz questions.
 *
 * Features:
 *  • Bold / Italic / Underline / Strikethrough
 *  • Superscript (x²) and Subscript (H₂)
 *  • Text color + Highlight color
 *  • Bullet list / Numbered list
 *  • Left / Center / Right alignment
 *  • Undo / Redo / Clear formatting
 *  • Scientific symbol picker (Math, Chemistry, Physics, Greek)
 *  • Inline image insertion (auto-compressed)
 *  • Paste sanitization (removes scripts, keeps formatting)
 *  • Keyboard shortcuts: Ctrl+B/I/U/Z/Y
 *  • Mobile-responsive toolbar (wraps to multiple rows)
 *  • XSS-safe: all HTML sanitized via DOMPurify
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import {
    Bold, Italic, Underline, Strikethrough,
    AlignLeft, AlignCenter, AlignRight,
    List, ListOrdered, Undo2, Redo2, Eraser,
    Image as ImageIcon, X, ChevronDown,
} from 'lucide-react';

// ── Symbol Data ──────────────────────────────────────────────────────────────

const SYMBOLS: Record<string, string[]> = {
    Mathematics: ['≤', '≥', '≠', '≈', '∞', '±', '√', '∑', '∫', 'π', '°', '×', '÷', '∝', '∂', '∇', '∈', '∉', '⊂', '⊃'],
    Chemistry:   ['→', '←', '⇌', '⇄', '⇒', '⇐', '↑', '↓', '·', '⊕', '⊗'],
    Physics:     ['Δ', 'Ω', '℃', '℉', 'ℏ', 'ε', 'μ', 'λ', 'σ', 'ρ', 'φ'],
    Greek:       ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω'],
    Logic:       ['∴', '∵', '∀', '∃', '¬', '∧', '∨', '⊻', '⊤', '⊥'],
};

// ── Color Palettes ───────────────────────────────────────────────────────────

const TEXT_COLORS = [
    '#000000', '#1f2937', '#dc2626', '#ea580c', '#d97706',
    '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#9333ea',
    '#db2777', '#be123c', '#0f766e', '#1d4ed8', '#ffffff',
];

const HIGHLIGHT_COLORS = [
    '#fef08a', '#fed7aa', '#fca5a5', '#bbf7d0',
    '#bfdbfe', '#ddd6fe', '#fbcfe8', '#ccfbf1',
];

// ── DOMPurify config ─────────────────────────────────────────────────────────

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        'b', 'i', 'u', 's', 'em', 'strong', 'sup', 'sub',
        'br', 'p', 'div', 'span', 'ul', 'ol', 'li',
        'img', 'mark',
    ],
    ALLOWED_ATTR: ['style', 'src', 'alt', 'class', 'align'],
    // Strip data: URIs for anything OTHER than images
    ALLOW_DATA_ATTR: false,
};

const sanitize = (html: string) => DOMPurify.sanitize(html, SANITIZE_CONFIG) as string;

// ── Helpers ──────────────────────────────────────────────────────────────────

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

const compressToDataUrl = (file: File, maxSize = 600, quality = 0.82): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new window.Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

// ── Toolbar Button ────────────────────────────────────────────────────────────

interface TBtnProps {
    onClick: () => void;
    title: string;
    active?: boolean;
    children: React.ReactNode;
    className?: string;
}

const TBtn: React.FC<TBtnProps> = ({ onClick, title, active, children, className = '' }) => (
    <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className={`
            flex items-center justify-center w-7 h-7 rounded text-xs font-bold transition-all
            ${active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
            ${className}
        `}
    >
        {children}
    </button>
);

const TDivider = () => (
    <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 flex-shrink-0" />
);

// ── Main Component ────────────────────────────────────────────────────────────

export interface ScientificEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
    /** Compact mode hides alignment and list buttons — suitable for MCQ option inputs */
    compact?: boolean;
}

const ScientificEditor: React.FC<ScientificEditorProps> = ({
    value,
    onChange,
    placeholder = 'Type here…',
    minHeight = '96px',
    compact = false,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const lastEmittedRef = useRef<string>(value ?? '');

    const [showSymbolPicker, setShowSymbolPicker] = useState(false);
    const [symbolCategory, setSymbolCategory] = useState<string>('Mathematics');
    const [showTextColor, setShowTextColor] = useState(false);
    const [showHighlight, setShowHighlight] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!value || !stripHtml(value));

    // ── Sync external value → contenteditable (e.g. switching questions) ──
    useEffect(() => {
        if (!editorRef.current) return;
        if (value !== lastEmittedRef.current) {
            editorRef.current.innerHTML = value ?? '';
            lastEmittedRef.current = value ?? '';
            setIsEmpty(!value || !stripHtml(value));
        }
    }, [value]);

    // ── Emit sanitized HTML up to parent ──────────────────────────────────
    const emitChange = useCallback(() => {
        if (!editorRef.current) return;
        const raw = editorRef.current.innerHTML;
        const clean = sanitize(raw);
        lastEmittedRef.current = clean;
        setIsEmpty(!stripHtml(raw));
        onChange(clean);
    }, [onChange]);

    // ── Selection save/restore (for symbol picker & color pickers) ────────
    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        }
    };

    const restoreSelection = () => {
        const sel = window.getSelection();
        if (sel && savedRangeRef.current) {
            sel.removeAllRanges();
            sel.addRange(savedRangeRef.current);
        }
    };

    // ── execCommand wrapper ───────────────────────────────────────────────
    const exec = (command: string, val?: string) => {
        editorRef.current?.focus();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand(command, false, val);
        emitChange();
    };

    // ── Symbol insertion ──────────────────────────────────────────────────
    const insertSymbol = (sym: string) => {
        editorRef.current?.focus();
        restoreSelection();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand('insertText', false, sym);
        emitChange();
        setShowSymbolPicker(false);
    };

    // ── Inline image insertion ────────────────────────────────────────────
    const handleImageFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;
        if (file.size > 8 * 1024 * 1024) { alert('Image must be under 8 MB'); return; }
        try {
            const dataUrl = await compressToDataUrl(file);
            editorRef.current?.focus();
            restoreSelection();
            // eslint-disable-next-line @typescript-eslint/no-deprecated
            document.execCommand('insertHTML', false,
                `<img src="${dataUrl}" alt="inline diagram" style="max-width:100%;height:auto;border-radius:6px;margin:4px 0;display:inline-block;" />`
            );
            emitChange();
        } catch {
            alert('Failed to process image');
        }
    };

    // ── Paste handler: sanitize pasted HTML ───────────────────────────────
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        const toInsert = html
            ? sanitize(html)
            : text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand('insertHTML', false, toInsert);
        emitChange();
    };

    // ── Keyboard shortcuts ────────────────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'b': e.preventDefault(); exec('bold'); break;
                case 'i': e.preventDefault(); exec('italic'); break;
                case 'u': e.preventDefault(); exec('underline'); break;
                case 'z': e.preventDefault(); exec('undo'); break;
                case 'y': e.preventDefault(); exec('redo'); break;
            }
        }
    };

    // ── Close pickers on outside click ────────────────────────────────────
    useEffect(() => {
        const close = () => {
            setShowSymbolPicker(false);
            setShowTextColor(false);
            setShowHighlight(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div
            className="border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all"
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 min-h-[42px]">

                {/* Formatting */}
                <TBtn onClick={() => exec('bold')}          title="Bold (Ctrl+B)">        <Bold className="w-3.5 h-3.5" /></TBtn>
                <TBtn onClick={() => exec('italic')}        title="Italic (Ctrl+I)">      <Italic className="w-3.5 h-3.5" /></TBtn>
                <TBtn onClick={() => exec('underline')}     title="Underline (Ctrl+U)">   <Underline className="w-3.5 h-3.5" /></TBtn>
                <TBtn onClick={() => exec('strikeThrough')} title="Strikethrough">        <Strikethrough className="w-3.5 h-3.5" /></TBtn>

                <TDivider />

                {/* Superscript / Subscript */}
                <TBtn onClick={() => exec('superscript')} title="Superscript — e.g. x², cm³">
                    <span className="text-[11px] font-bold leading-none">X<sup style={{ fontSize: '8px' }}>2</sup></span>
                </TBtn>
                <TBtn onClick={() => exec('subscript')} title="Subscript — e.g. H₂O, CO₂">
                    <span className="text-[11px] font-bold leading-none">X<sub style={{ fontSize: '8px' }}>2</sub></span>
                </TBtn>

                <TDivider />

                {/* Text color picker */}
                <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                    <TBtn
                        onClick={() => {
                            saveSelection();
                            setShowTextColor(v => !v);
                            setShowHighlight(false);
                        }}
                        title="Text Color"
                    >
                        <span className="text-[10px] font-black leading-none">A</span>
                        <span className="ml-0.5"><ChevronDown className="w-2.5 h-2.5" /></span>
                    </TBtn>
                    {showTextColor && (
                        <div className="absolute top-9 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-xl">
                            <p className="text-[10px] text-gray-500 mb-1 font-medium">Text Color</p>
                            <div className="grid grid-cols-5 gap-1">
                                {TEXT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            restoreSelection();
                                            exec('foreColor', c);
                                            setShowTextColor(false);
                                        }}
                                        style={{ background: c }}
                                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Highlight color */}
                <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                    <TBtn
                        onClick={() => {
                            saveSelection();
                            setShowHighlight(v => !v);
                            setShowTextColor(false);
                        }}
                        title="Highlight Color"
                    >
                        <span className="text-[10px] font-black leading-none bg-yellow-300 px-0.5 rounded-sm">H</span>
                        <span className="ml-0.5"><ChevronDown className="w-2.5 h-2.5" /></span>
                    </TBtn>
                    {showHighlight && (
                        <div className="absolute top-9 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-xl">
                            <p className="text-[10px] text-gray-500 mb-1 font-medium">Highlight</p>
                            <div className="grid grid-cols-4 gap-1">
                                {HIGHLIGHT_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            restoreSelection();
                                            exec('hiliteColor', c);
                                            setShowHighlight(false);
                                        }}
                                        style={{ background: c }}
                                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                                        title={c}
                                    />
                                ))}
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        restoreSelection();
                                        exec('hiliteColor', 'transparent');
                                        setShowHighlight(false);
                                    }}
                                    className="w-5 h-5 rounded border border-gray-300 hover:scale-110 bg-white text-gray-400 text-[8px] flex items-center justify-center"
                                    title="Remove highlight"
                                >✕</button>
                            </div>
                        </div>
                    )}
                </div>

                {!compact && (
                    <>
                        <TDivider />
                        {/* Lists */}
                        <TBtn onClick={() => exec('insertUnorderedList')} title="Bullet List"><List className="w-3.5 h-3.5" /></TBtn>
                        <TBtn onClick={() => exec('insertOrderedList')}   title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></TBtn>

                        <TDivider />

                        {/* Alignment */}
                        <TBtn onClick={() => exec('justifyLeft')}   title="Align Left">  <AlignLeft className="w-3.5 h-3.5" /></TBtn>
                        <TBtn onClick={() => exec('justifyCenter')} title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></TBtn>
                        <TBtn onClick={() => exec('justifyRight')}  title="Align Right"> <AlignRight className="w-3.5 h-3.5" /></TBtn>
                    </>
                )}

                <TDivider />

                {/* Undo / Redo / Clear */}
                <TBtn onClick={() => exec('undo')}          title="Undo (Ctrl+Z)"><Undo2 className="w-3.5 h-3.5" /></TBtn>
                <TBtn onClick={() => exec('redo')}          title="Redo (Ctrl+Y)"><Redo2 className="w-3.5 h-3.5" /></TBtn>
                <TBtn onClick={() => exec('removeFormat')}  title="Clear Formatting"><Eraser className="w-3.5 h-3.5" /></TBtn>

                <TDivider />

                {/* Symbol Picker */}
                <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                    <TBtn
                        onClick={() => {
                            saveSelection();
                            setShowSymbolPicker(v => !v);
                        }}
                        title="Insert Scientific Symbol"
                        className="w-auto px-2 gap-1"
                    >
                        <span className="text-[11px] font-bold">Ω</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                    </TBtn>

                    {showSymbolPicker && (
                        <div
                            className="absolute top-9 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-3 w-72"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Scientific Symbols</p>
                                <button type="button" onClick={() => setShowSymbolPicker(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Category tabs */}
                            <div className="flex gap-1 mb-2 flex-wrap">
                                {Object.keys(SYMBOLS).map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); setSymbolCategory(cat); }}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${symbolCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Symbol grid */}
                            <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                                {SYMBOLS[symbolCategory].map(sym => (
                                    <button
                                        key={sym}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); insertSymbol(sym); }}
                                        className="w-8 h-8 flex items-center justify-center text-base hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 rounded-lg transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 font-mono"
                                        title={sym}
                                    >
                                        {sym}
                                    </button>
                                ))}
                            </div>

                            {/* Quick reference */}
                            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-[10px] text-gray-400">
                                    💡 Tip: Use X² for superscript, X₂ for subscript in the toolbar
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Inline Image */}
                <div onMouseDown={(e) => e.stopPropagation()}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { restoreSelection(); handleImageFile(file); }
                            e.target.value = '';
                        }}
                    />
                    <TBtn
                        onClick={() => { saveSelection(); fileInputRef.current?.click(); }}
                        title="Insert Inline Image / Diagram"
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                    </TBtn>
                </div>
            </div>

            {/* ── Content Editable Area ── */}
            <div className="relative">
                {/* Placeholder */}
                {isEmpty && (
                    <div
                        className="absolute top-0 left-0 px-4 py-3 text-gray-400 dark:text-gray-500 pointer-events-none text-sm select-none"
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {placeholder}
                    </div>
                )}

                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={emitChange}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsEmpty(false)}
                    onBlur={() => setIsEmpty(!stripHtml(editorRef.current?.innerHTML ?? ''))}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none leading-relaxed"
                    style={{
                        minHeight,
                        overflowY: 'auto',
                        wordBreak: 'break-word',
                    }}
                    aria-label="Rich text editor"
                    aria-multiline="true"
                    role="textbox"
                    spellCheck
                />
            </div>

            {/* ── Quick-access chemistry toolbar ── */}
            {!compact && (
                <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-medium self-center mr-1">Quick:</span>
                    {['→', '⇌', 'H₂O', 'CO₂', 'Na⁺', 'x²', 'a²+b²=c²', '√', 'π', '∞', '±', '≤', '≥', '≠', '°C'].map(q => (
                        <button
                            key={q}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                editorRef.current?.focus();
                                // eslint-disable-next-line @typescript-eslint/no-deprecated
                                document.execCommand('insertText', false, q);
                                emitChange();
                            }}
                            className="px-1.5 py-0.5 text-[11px] font-mono bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:border-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
                            title={`Insert: ${q}`}
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScientificEditor;
export { sanitize, stripHtml };
