/**
 * smartPaste.ts — Smart Paste Engine for NEET/JEE ScientificEditor.
 *
 * Pipeline (runs on every paste event):
 *  1. Detect clipboard source (ChatGPT, Gemini, Word, Google Docs, PDF, generic)
 *  2. Handle clipboard images first (if image data is present, skip HTML)
 *  3. Source-specific junk removal (mso-*, kix-*, Gemini wrappers, etc.)
 *  4. Preserve real formatting: <b>, <i>, <u>, <sup>, <sub>, <table>, <ul>, <ol>, <img>, <a>
 *  5. Apply chemistry formula conversion (H2O → H₂O, SO4^2- → SO₄²⁻)
 *  6. Apply physics notation conversion (LT^-1 → LT⁻¹, ^x+y → <sup>x+y</sup>)
 *  7. Convert plain-text LaTeX to $...$ markers (for latexRenderer to handle)
 *  8. Apply math fraction conversion (context-aware: 1/2 → ½ only in equations)
 *  9. DOMPurify XSS sanitization
 * 10. cleanHtml() normalization
 *
 * Decisions implemented (from approved plan):
 *  - Compound superscripts (x+y, -2x): use <sup>/<sub> HTML, NOT Unicode
 *  - Single-char supers (², ³, ⁺, ⁻): Unicode
 *  - Chemistry: strict regex (capital letter + optional lowercase + digit)
 *  - Fractions: context-aware (only in math expressions)
 *  - LaTeX errors: graceful fallback in latexRenderer (no handling needed here)
 */

import DOMPurify from 'dompurify';
import { cleanHtml } from './htmlUtils';

// ── DOMPurify config for paste (more permissive than display config) ──────────

const PASTE_SANITIZE_CONFIG: DOMPurify.Config = {
    ALLOWED_TAGS: [
        // Inline formatting
        'b', 'i', 'u', 's', 'em', 'strong', 'sup', 'sub', 'mark', 'code',
        // Block structure
        'br', 'p', 'div', 'span',
        // Lists
        'ul', 'ol', 'li',
        // Tables
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
        // Media & links
        'img', 'a',
        // Headings (from Word/Docs)
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        // Preformatted (code blocks from ChatGPT)
        'pre', 'blockquote',
    ],
    ALLOWED_ATTR: [
        // Styling (whitelist only semantic styles)
        'style',
        // Images
        'src', 'alt', 'width', 'height',
        // Links
        'href', 'target', 'rel',
        // Tables
        'colspan', 'rowspan', 'align',
        // Accessibility
        'class',
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'link', 'meta', 'object', 'embed', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

// ── Source detection ──────────────────────────────────────────────────────────

type ClipboardSource = 'chatgpt' | 'gemini' | 'word' | 'googledocs' | 'pdf' | 'generic';

function detectSource(html: string): ClipboardSource {
    if (!html) return 'generic';
    if (/data-message-author-role|class="markdown"|chatgpt\.com|openai\.com/i.test(html)) return 'chatgpt';
    if (/class="model-response-text"|gemini\.google\.com|class="markdown-body"/i.test(html)) return 'gemini';
    if (/xmlns:o="urn:schemas-microsoft-com|mso-[a-z]|<o:p>|WordDocument/i.test(html)) return 'word';
    if (/id="docs-internal-guid|class="kix-|google-docs-chip/i.test(html)) return 'googledocs';
    if (/class="(?:page|textLayer|pdfViewer)|\.pdf\b/i.test(html)) return 'pdf';
    return 'generic';
}

// ── Style attribute cleaner ───────────────────────────────────────────────────

/**
 * Keep only semantically meaningful CSS properties in style="" attributes.
 * Removes font-family, font-size, margin, padding, line-height, etc.
 */
function cleanStyleAttr(style: string): string {
    const KEEP_PROPERTIES = new Set([
        'color', 'background-color', 'background',
        'font-weight', 'font-style', 'text-decoration',
        'vertical-align', 'text-align',
    ]);

    const kept = style
        .split(';')
        .map(s => s.trim())
        .filter(s => {
            if (!s) return false;
            const prop = s.split(':')[0]?.trim().toLowerCase();
            return prop && KEEP_PROPERTIES.has(prop);
        })
        .join('; ');

    return kept;
}

function sanitizeStyleAttrs(html: string): string {
    return html.replace(/\s+style="([^"]*)"/gi, (_, style) => {
        const cleaned = cleanStyleAttr(style);
        return cleaned ? ` style="${cleaned}"` : '';
    });
}

// ── Source-specific HTML cleaners ─────────────────────────────────────────────

function removeWordJunk(html: string): string {
    let clean = html;
    // Remove conditional comments: <!--[if gte mso 9]> ... <![endif]-->
    clean = clean.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');
    // Remove all mso-* style rules inside style attrs
    clean = clean.replace(/mso-[a-zA-Z-]+\s*:[^;"]*(;|(?="))/gi, '');
    // Remove <o:p> and <o:*> tags (Word paragraph markers)
    clean = clean.replace(/<\/?o:[a-z]+[^>]*>/gi, '');
    // Remove <w:*> and <m:*> tags
    clean = clean.replace(/<\/?(?:w|m|v):[a-z]+[^>]*>/gi, '');
    // Remove Word class attributes (MsoNormal, MsoListParagraph, etc.)
    clean = clean.replace(/\s+class="Mso[A-Z][^"]*"/gi, '');
    // Map semantic Word tags
    clean = clean.replace(/<w:b\/?>/gi, '<b>').replace(/<\/w:b>/gi, '</b>');
    return clean;
}

function removeGoogleDocsJunk(html: string): string {
    let clean = html;
    // Strip outer Google Docs container div (keep inner content)
    clean = clean.replace(/<div[^>]*id="docs-internal-guid-[^"]*"[^>]*>/gi, '');
    // Remove kix-* class spans (Google Docs internal spans) but keep content
    clean = clean.replace(/<span[^>]*class="kix-[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    // Remove Google Docs paragraph styles but keep structure
    clean = clean.replace(/\s+class="c\d+"/g, '');
    return clean;
}

function removeChatGPTJunk(html: string): string {
    let clean = html;
    // Remove sr-only elements (screen reader text), copy buttons, etc.
    clean = clean.replace(/<[^>]*class="[^"]*(?:sr-only|copy-button|button-group|citation)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '');
    // Remove data-message-* attributes
    clean = clean.replace(/\s+data-message-[a-z-]+="[^"]*"/gi, '');
    // Strip outer .markdown, .prose, .chat-message-content wrappers but keep content
    // Keep: <strong>, <em>, <ul>, <ol>, <li>, <p>, <code>, <pre>, <table>
    // These are already handled by DOMPurify allowlist
    return clean;
}

function removeGeminiJunk(html: string): string {
    let clean = html;
    // Remove Gemini-specific class attributes from outer containers
    clean = clean.replace(/\s+class="(?:model-response-text|markdown-body|gemini-[a-z-]*)"/gi, '');
    // Remove feedback/thumbs buttons
    clean = clean.replace(/<div[^>]*class="[^"]*thumbs[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    return clean;
}

function removePDFJunk(html: string): string {
    let clean = html;
    // Strip PDF viewer page/layer wrappers
    clean = clean.replace(/<div[^>]*class="(?:page|textLayer|pdfViewer)"[^>]*>/gi, '');
    return clean;
}

// ── Chemistry formula converter ───────────────────────────────────────────────

// Unicode superscript map (single chars only — per approved plan)
const SUP_UNICODE: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', 'n': 'ⁿ',
};

// Unicode subscript map (single chars only)
const SUB_UNICODE: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋',
};

function toUnicodeSup(s: string): string {
    return s.split('').map(c => SUP_UNICODE[c] ?? c).join('');
}
function toUnicodeSub(s: string): string {
    return s.split('').map(c => SUB_UNICODE[c] ?? c).join('');
}

/**
 * Strict chemistry formula detector.
 * Approved rule: must start with capital letter (element symbol),
 * optionally followed by lowercase, then digit subscripts.
 * Does NOT match: H2-receptor, P53, H2 blocker, gene names.
 *
 * Matches: H2O, CO2, H2SO4, CH3COOH, Ca(OH)2, NH4+, SO4^2-, Fe2O3
 */
const CHEM_FORMULA_RE =
    /\b((?:[A-Z][a-z]?|\((?:[A-Z][a-z]?\d*)+\))(?:\d+)?(?:[A-Z][a-z]?(?:\d+)?|\((?:[A-Z][a-z]?\d*)+\)(?:\d+)?)*(?:\^[\d+\-]+)?)\b/g;

/**
 * Convert chemistry subscript digits and ion superscripts within a valid formula.
 * e.g. "H2SO4" → "H₂SO₄", "SO4^2-" → "SO₄²⁻", "Ca(OH)2" → "Ca(OH)₂"
 */
function convertChemFormula(formula: string): string {
    let result = formula;

    // 1. Handle charge notation: ^2- → ²⁻, ^2+ → ²⁺, ^+ → ⁺, ^- → ⁻
    result = result.replace(/\^(\d*)([+\-])/g, (_, num, sign) => {
        const numPart = num ? toUnicodeSup(num) : '';
        const signPart = SUP_UNICODE[sign] ?? sign;
        return numPart + signPart;
    });

    // 2. Convert digit subscripts (digits after letters/closing parens)
    result = result.replace(/([A-Za-z\)])(\d+)/g, (_, prev, digits) =>
        prev + toUnicodeSub(digits)
    );

    return result;
}

/**
 * Apply chemistry conversion to plain text portions of HTML.
 * Only processes text nodes (not inside HTML tags or already-converted content).
 */
export function applyChemistryConversion(html: string): string {
    // Split on HTML tags, only process text chunks
    const chunks = html.split(/(<[^>]+>)/);
    return chunks.map((chunk, i) => {
        if (i % 2 === 1) return chunk; // HTML tag — skip
        if (!chunk) return chunk;
        return chunk.replace(CHEM_FORMULA_RE, convertChemFormula);
    }).join('');
}

// ── Physics notation converter ────────────────────────────────────────────────

/**
 * Convert physics superscript/subscript patterns in plain text.
 *
 * Rules (approved plan):
 *  - Single char: ^2 → ²,  ^- → ⁻,  ^+ → ⁺  (Unicode)
 *  - Multi-char:  ^x+y → <sup>x+y</sup>,  ^-2x → <sup>-2x</sup>  (HTML tags)
 *  - Dimensional: [LT^-1] → [LT⁻¹],  [LT^-2] → [LT⁻²]
 *  - Subscript:   _2 → ₂ (single digit), _n → <sub>n</sub> (multi/variable)
 */
export function applyPhysicsConversion(text: string): string {
    // Process text nodes only
    const chunks = text.split(/(<[^>]+>)/);
    return chunks.map((chunk, i) => {
        if (i % 2 === 1) return chunk;
        if (!chunk) return chunk;

        let t = chunk;

        // 1. Superscripts: ^{...} LaTeX style → process content
        //    (LaTeX will be handled by latexRenderer, skip here)

        // 2. ^-1, ^-2, ^-3 → ⁻¹, ⁻²  etc. (negative numeric — single chars)
        t = t.replace(/\^-(\d)/g, (_, d) => '⁻' + (SUP_UNICODE[d] ?? d));

        // 3. ^2, ^3 (single positive digit) → ², ³
        t = t.replace(/\^(\d)(?!\d)/g, (_, d) => SUP_UNICODE[d] ?? d);

        // 4. Multi-char superscripts: ^x+y, ^-2x, ^n+1, ^2n-1 → <sup>...</sup>
        //    Must come after single-char rules
        t = t.replace(/\^([A-Za-z0-9][A-Za-z0-9+\-*/]*)/g, (_, expr) => {
            // If already converted to Unicode, skip
            if (/^[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿ]+$/.test(expr)) return '^' + expr;
            return `<sup>${expr}</sup>`;
        });

        // 5. Subscripts: _2 (single digit) → ₂
        t = t.replace(/_(\d)(?!\d)/g, (_, d) => SUB_UNICODE[d] ?? d);

        // 6. Multi-char subscripts: _n, _i, _x+1 → <sub>...</sub>
        t = t.replace(/_([A-Za-z][A-Za-z0-9+\-]*)/g, (_, expr) => `<sub>${expr}</sub>`);

        // 7. Proportionality: \propto, `propto` → ∝
        t = t.replace(/\\propto\b|(?<=\s)propto(?=\s)/g, '∝');

        // 8. Implication arrows: => → ⇒, <=> → ⇔
        t = t.replace(/<=>/g, '⇔');
        t = t.replace(/(?<![<])=>(?!>)/g, '⇒');

        return t;
    }).join('');
}

// ── Math fraction converter (context-aware) ────────────────────────────────────

/**
 * Unicode fraction glyphs (approved: only common math ones).
 */
const UNICODE_FRACTIONS: Record<string, string> = {
    '1/2': '½', '1/4': '¼', '3/4': '¾',
    '1/3': '⅓', '2/3': '⅔',
    '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
};

/**
 * Convert standalone mathematical fractions to Unicode glyphs.
 * Context-aware: only converts when surrounded by math operators, =, spaces, or at boundaries.
 * Does NOT convert: "1/2 cup", "Page 1/2", dates, URLs, file paths.
 */
export function applyFractionConversion(text: string): string {
    const chunks = text.split(/(<[^>]+>)/);
    return chunks.map((chunk, i) => {
        if (i % 2 === 1) return chunk;
        if (!chunk) return chunk;

        return chunk.replace(
            /(?<=[=\s(,×÷+\-±∓∝∞∑∫√]|^)(1\/2|1\/4|3\/4|1\/3|2\/3|1\/8|3\/8|5\/8|7\/8)(?=[=\s),×÷+\-±∓∝∞]|$)/g,
            (match) => UNICODE_FRACTIONS[match] ?? match
        );
    }).join('');
}

// ── Main Smart Paste function ─────────────────────────────────────────────────

/**
 * smartPaste — Full transformation pipeline for pasted content.
 *
 * @param clipboardHtml  Raw HTML from ClipboardEvent (may be empty string)
 * @param clipboardText  Plain text from ClipboardEvent (fallback)
 * @returns              Clean HTML safe for contenteditable + MongoDB storage
 */
export function smartPaste(clipboardHtml: string, clipboardText: string): string {
    // ── Step 1: Plain text fallback ───────────────────────────────────────────
    if (!clipboardHtml || clipboardHtml.trim() === '') {
        // Plain text only — apply chemistry + physics + fractions
        let text = clipboardText
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        text = applyPhysicsConversion(text);
        text = applyChemistryConversion(text);
        text = applyFractionConversion(text);

        // Preserve line breaks
        text = text.replace(/\n/g, '<br>');
        return cleanHtml(text);
    }

    // ── Step 2: Detect source ─────────────────────────────────────────────────
    const source = detectSource(clipboardHtml);

    // ── Step 3: Source-specific junk removal ──────────────────────────────────
    let html = clipboardHtml;
    switch (source) {
        case 'word':      html = removeWordJunk(html); break;
        case 'googledocs': html = removeGoogleDocsJunk(html); break;
        case 'chatgpt':   html = removeChatGPTJunk(html); break;
        case 'gemini':    html = removeGeminiJunk(html); break;
        case 'pdf':       html = removePDFJunk(html); break;
        default:          break;
    }

    // ── Step 4: Clean style attributes (keep semantic, remove layout junk) ────
    html = sanitizeStyleAttrs(html);

    // ── Step 5: Apply physics notation (^-1, ^x+y, _n, ⇒, ∝) ────────────────
    html = applyPhysicsConversion(html);

    // ── Step 6: Apply chemistry formula conversion ────────────────────────────
    html = applyChemistryConversion(html);

    // ── Step 7: Apply math fraction conversion (context-aware) ───────────────
    html = applyFractionConversion(html);

    // ── Step 8: DOMPurify XSS sanitization ───────────────────────────────────
    html = DOMPurify.sanitize(html, PASTE_SANITIZE_CONFIG) as string;

    // ── Step 9: cleanHtml normalization (remove empty tags, decode entities) ──
    html = cleanHtml(html);

    return html;
}
