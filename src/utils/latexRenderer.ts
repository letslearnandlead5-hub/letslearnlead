/**
 * latexRenderer.ts — KaTeX-based LaTeX rendering for NEET/JEE quiz content.
 *
 * Decisions (from approved plan):
 *  - `$...$`   → inline math (always)
 *  - `$$...$$` → display math (centered) for question/explanation context;
 *                auto-downgraded to inline when fieldType === 'option' | 'match'
 *  - Malformed LaTeX → graceful fallback to raw LaTeX text (never crashes)
 *  - Only console.warn on error (no UI error indicators)
 */

import katex from 'katex';

export type FieldType = 'question' | 'option' | 'match' | 'explanation';

// ── KaTeX render options ──────────────────────────────────────────────────────

function katexOpts(displayMode: boolean): katex.KatexOptions {
    return {
        displayMode,
        throwOnError: false,      // never throw — fallback handled below
        strict: false,            // allow non-standard LaTeX from Gemini/ChatGPT
        trust: false,             // no \url or other trust-required commands
        macros: {
            // Common NEET/JEE shorthands
            '\\implies':    '\\Rightarrow',
            '\\iff':        '\\Leftrightarrow',
            '\\degree':     '^{\\circ}',
            '\\angstrom':   '\\text{Å}',
        },
    };
}

// ── Single expression renderer ────────────────────────────────────────────────

/**
 * Render a single LaTeX expression to an HTML string.
 * Falls back to the raw expression on parse error.
 */
export function renderLatex(expr: string, displayMode = false): string {
    try {
        const rendered = katex.renderToString(expr.trim(), katexOpts(displayMode));
        return displayMode
            ? `<span class="katex-display-inline" style="display:block;text-align:center;margin:8px 0;">${rendered}</span>`
            : rendered;
    } catch (err) {
        console.warn('[LaTeX] Render error, falling back to raw:', expr, err);
        // Graceful fallback: wrap in <code> so it's still readable
        return `<code class="latex-fallback" style="font-family:monospace;font-size:0.9em;color:#6366f1;">$${expr}$</code>`;
    }
}

// ── Detect whether a string contains any LaTeX ────────────────────────────────

export function hasLatex(text: string): boolean {
    // $...$ or $$...$$ or \command{
    return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\(?:frac|sqrt|sum|int|prod|lim|text|mathbf|vec|hat|bar|dot|ddot|overline|underline|left|right|begin|end)\{/.test(text);
}

// ── Main: render all LaTeX in an HTML string ──────────────────────────────────

/**
 * renderLatexInHtml — Find and render all $...$ and $$...$$ markers
 * inside an HTML string without corrupting surrounding HTML tags.
 *
 * @param html        The HTML content (may contain LaTeX between tags)
 * @param fieldType   Context — controls display vs inline mode for $$...$$
 */
export function renderLatexInHtml(html: string, fieldType: FieldType = 'question'): string {
    if (!html || !hasLatex(html)) return html;

    // Determine if $$...$$ should be display or inline
    const allowDisplay = fieldType === 'question' || fieldType === 'explanation';

    // We process text nodes only (split on HTML tags to avoid corrupting attrs)
    // Strategy: split into [text, tag, text, tag, ...] chunks, only process text chunks
    const chunks = html.split(/(<[^>]+>)/);

    return chunks.map((chunk, i) => {
        // Odd-indexed chunks are HTML tags — leave untouched
        if (i % 2 === 1) return chunk;
        if (!chunk) return chunk;

        // Process $$...$$ first (display mode)
        let processed = chunk.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) =>
            renderLatex(expr, allowDisplay)
        );

        // Then process $...$ (inline mode — always inline regardless of fieldType)
        processed = processed.replace(/\$([^$\n]+?)\$/g, (_, expr) =>
            renderLatex(expr, false)
        );

        return processed;
    }).join('');
}
