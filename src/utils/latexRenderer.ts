/**
 * latexRenderer.ts — Zero-dependency LaTeX → HTML converter for NEET/JEE content.
 *
 * NO external packages required. Handles all patterns seen in NEET/JEE questions
 * from ChatGPT, Gemini, Word, NCERT PDFs:
 *
 *  Fractions:     \frac{a}{b}       → styled HTML fraction
 *  Superscripts:  x^{n+1}, x^2      → <sup> tags
 *  Subscripts:    H_{2}O, H_2O      → <sub> tags
 *  Square root:   \sqrt{x}          → √x
 *  Text wrapper:  \text{COO}        → plain text (stripped)
 *  Math bold:     \mathbf{F}        → <b>F</b>
 *  Greek letters: \alpha, \beta...  → Unicode α β γ...
 *  Math symbols:  \times, \pm...    → Unicode × ± ≤ ≥...
 *  Display mode:  $$...$$           → centered block
 *  Inline mode:   $...$             → inline span
 *
 * Decisions (approved plan):
 *  - Malformed LaTeX → graceful fallback to raw text, console.warn only
 *  - $$...$$ for question/explanation → centered display block
 *  - $$...$$ for option/match → always inline
 *  - Multi-char superscripts → <sup> HTML tags (not Unicode)
 */

export type FieldType = 'question' | 'option' | 'match' | 'explanation';

// ── Greek letter map ──────────────────────────────────────────────────────────

const GREEK: Record<string, string> = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε',
    zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ',
    lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
    rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ',
    chi: 'χ', psi: 'ψ', omega: 'ω',
    Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε',
    Zeta: 'Ζ', Eta: 'Η', Theta: 'Θ', Iota: 'Ι', Kappa: 'Κ',
    Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν', Xi: 'Ξ', Pi: 'Π',
    Rho: 'Ρ', Sigma: 'Σ', Tau: 'Τ', Upsilon: 'Υ', Phi: 'Φ',
    Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
    // Common variants
    varepsilon: 'ε', varphi: 'φ', varpi: 'ϖ', varrho: 'ϱ', varsigma: 'ς', vartheta: 'ϑ',
};

// ── Math symbol map ───────────────────────────────────────────────────────────

const SYMBOLS: Record<string, string> = {
    // Operators
    times: '×', div: '÷', cdot: '·', pm: '±', mp: '∓',
    // Relations
    leq: '≤', geq: '≥', neq: '≠', approx: '≈', equiv: '≡',
    propto: '∝', sim: '∼', simeq: '≃', cong: '≅',
    // Logic / Sets
    in: '∈', notin: '∉', subset: '⊂', supset: '⊃',
    cup: '∪', cap: '∩', emptyset: '∅',
    forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨',
    // Arrows
    to: '→', leftarrow: '←', rightarrow: '→',
    Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔',
    implies: '⇒', iff: '⇔',
    uparrow: '↑', downarrow: '↓', leftrightarrow: '↔',
    // Calculus
    partial: '∂', nabla: '∇', infty: '∞',
    int: '∫', oint: '∮', sum: '∑', prod: '∏',
    // Misc
    circ: '°', degree: '°', prime: '′', ldots: '…', cdots: '⋯',
    hbar: 'ℏ', Re: 'ℜ', Im: 'ℑ',
    // Physics / Chemistry
    rightleftharpoons: '⇌', rightleftarrows: '⇄',
    // Spaces (collapse to nothing or single space)
    quad: ' ', qquad: '  ', ',': '', ';': '',
};

// ── Unicode superscript / subscript maps (single chars) ───────────────────────

const SUP_UNI: Record<string, string> = {
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
    '+':'⁺','-':'⁻','n':'ⁿ','i':'ⁱ',
};
const SUB_UNI: Record<string, string> = {
    '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
    '+':'₊','-':'₋','a':'ₐ','e':'ₑ','i':'ᵢ','o':'ₒ','u':'ᵤ','n':'ₙ',
};

function toSup(content: string): string {
    // Single char → Unicode; multi-char → <sup> tag
    if (content.length === 1 && SUP_UNI[content]) return SUP_UNI[content];
    return `<sup>${content}</sup>`;
}
function toSub(content: string): string {
    if (content.length === 1 && SUB_UNI[content]) return SUB_UNI[content];
    return `<sub>${content}</sub>`;
}

// ── Brace-aware content extractor ─────────────────────────────────────────────

/**
 * Extract the content of a top-level braced group starting at `pos` in `str`.
 * Returns [content, endPos] where endPos points past the closing '}'.
 */
function extractBraces(str: string, pos: number): [string, number] {
    if (str[pos] !== '{') {
        // No braces — single character
        return [str[pos] ?? '', pos + 1];
    }
    let depth = 0, i = pos;
    const start = pos + 1;
    while (i < str.length) {
        if (str[i] === '{') depth++;
        else if (str[i] === '}') {
            depth--;
            if (depth === 0) return [str.slice(start, i), i + 1];
        }
        i++;
    }
    // Unclosed brace — fallback
    return [str.slice(start), str.length];
}

// ── Core LaTeX → HTML converter ───────────────────────────────────────────────

/**
 * convertLatex — Convert a single LaTeX expression (without $ delimiters) to HTML.
 * Processes the string left-to-right handling \commands and {groups}.
 */
export function convertLatex(expr: string): string {
    if (!expr) return '';
    let result = '';
    let i = 0;
    const s = expr.trim();

    while (i < s.length) {
        const ch = s[i];

        // ── Backslash command ───────────────────────────────────────────────
        if (ch === '\\') {
            i++;
            // Read command name (letters only, or single non-letter)
            let cmd = '';
            if (/[a-zA-Z]/.test(s[i])) {
                while (i < s.length && /[a-zA-Z]/.test(s[i])) {
                    cmd += s[i++];
                }
                // Skip optional trailing space after command
                if (s[i] === ' ') i++;
            } else {
                // Single-char commands: \\, \{, \}, \, etc.
                cmd = s[i++];
            }

            switch (cmd) {
                // Fraction: \frac{num}{den}
                case 'frac': {
                    const [num, afterNum] = extractBraces(s, i);
                    i = afterNum;
                    const [den, afterDen] = extractBraces(s, i);
                    i = afterDen;
                    const numHtml = convertLatex(num);
                    const denHtml = convertLatex(den);
                    result += `<span class="math-frac" style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;font-size:0.85em;margin:0 2px;">`
                        + `<span style="border-bottom:1px solid currentColor;padding:0 2px;line-height:1.3;">${numHtml}</span>`
                        + `<span style="padding:0 2px;line-height:1.3;">${denHtml}</span>`
                        + `</span>`;
                    break;
                }

                // Square root: \sqrt{x} or \sqrt[n]{x}
                case 'sqrt': {
                    // Check for optional [n]
                    let index = '';
                    if (s[i] === '[') {
                        const end = s.indexOf(']', i);
                        index = s.slice(i + 1, end);
                        i = end + 1;
                    }
                    const [inner, afterInner] = extractBraces(s, i);
                    i = afterInner;
                    const innerHtml = convertLatex(inner);
                    result += index
                        ? `<span style="font-size:0.85em;">${convertLatex(index)}</span><span style="font-size:1.1em;">√</span><span style="border-top:1px solid currentColor;padding:0 1px;">${innerHtml}</span>`
                        : `<span style="font-size:1.1em;">√</span><span style="border-top:1px solid currentColor;padding:0 1px;">${innerHtml}</span>`;
                    break;
                }

                // Text: \text{...} — render as plain text (strip any LaTeX inside)
                case 'text':
                case 'mathrm':
                case 'mathit':
                case 'textrm':
                case 'textit': {
                    const [inner, after] = extractBraces(s, i);
                    i = after;
                    result += convertLatex(inner);
                    break;
                }

                // Bold: \mathbf{...} → <b>
                case 'mathbf':
                case 'textbf':
                case 'boldsymbol': {
                    const [inner, after] = extractBraces(s, i);
                    i = after;
                    result += `<b>${convertLatex(inner)}</b>`;
                    break;
                }

                // Overline / underline / hat / vec (decorators — simplified)
                case 'overline':
                case 'bar': {
                    const [inner, after] = extractBraces(s, i);
                    i = after;
                    result += `<span style="text-decoration:overline;">${convertLatex(inner)}</span>`;
                    break;
                }
                case 'underline': {
                    const [inner, after] = extractBraces(s, i);
                    i = after;
                    result += `<span style="text-decoration:underline;">${convertLatex(inner)}</span>`;
                    break;
                }
                case 'hat': { const [inn, af] = extractBraces(s, i); i = af; result += convertLatex(inn) + '̂'; break; }
                case 'vec': { const [inn, af] = extractBraces(s, i); i = af; result += convertLatex(inn) + '⃗'; break; }
                case 'dot': { const [inn, af] = extractBraces(s, i); i = af; result += convertLatex(inn) + '̇'; break; }
                case 'ddot': { const [inn, af] = extractBraces(s, i); i = af; result += convertLatex(inn) + '̈'; break; }

                // Limits / sums with bounds — simplified: just render as sym_lower^upper
                case 'sum': case 'prod': case 'int': case 'oint': {
                    result += SYMBOLS[cmd] ?? cmd;
                    break;
                }
                case 'lim': {
                    result += 'lim';
                    break;
                }

                // Left/Right delimiters — just pass through inner content
                case 'left': case 'right': {
                    // Next char is the delimiter, just output it
                    if (i < s.length) result += s[i++];
                    break;
                }

                // Escaped chars
                case '{': result += '{'; break;
                case '}': result += '}'; break;
                case '\\': result += '<br>'; break;
                case ' ': result += ' '; break;
                case ',': result += ''; break;
                case ';': result += ''; break;
                case '!': result += ''; break; // negative space

                default: {
                    // Greek letters
                    if (GREEK[cmd]) { result += GREEK[cmd]; break; }
                    // Math symbols
                    if (SYMBOLS[cmd]) { result += SYMBOLS[cmd]; break; }
                    // Unknown command — try to handle brace arg gracefully
                    if (i < s.length && s[i] === '{') {
                        const [inner, after] = extractBraces(s, i);
                        i = after;
                        result += convertLatex(inner);
                    } else {
                        result += cmd; // Fallback: show command name
                    }
                }
            }
            continue;
        }

        // ── Superscript: ^ ──────────────────────────────────────────────────
        if (ch === '^') {
            i++;
            const [content, after] = extractBraces(s, i);
            i = after;
            result += toSup(convertLatex(content));
            continue;
        }

        // ── Subscript: _ ────────────────────────────────────────────────────
        if (ch === '_') {
            i++;
            const [content, after] = extractBraces(s, i);
            i = after;
            result += toSub(convertLatex(content));
            continue;
        }

        // ── Braced group: {content} — render as-is ──────────────────────────
        if (ch === '{') {
            const [content, after] = extractBraces(s, i);
            i = after;
            result += convertLatex(content);
            continue;
        }

        // ── Plain character ──────────────────────────────────────────────────
        // Escape HTML special chars
        if (ch === '<') { result += '&lt;'; i++; continue; }
        if (ch === '>') { result += '&gt;'; i++; continue; }
        if (ch === '&') { result += '&amp;'; i++; continue; }

        result += ch;
        i++;
    }

    return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Render a single LaTeX expression to HTML.
 * displayMode = true → wrapped in a centered block span.
 * Falls back to raw text on error (never throws).
 */
export function renderLatex(expr: string, displayMode = false): string {
    try {
        const inner = convertLatex(expr.trim());
        if (displayMode) {
            return `<span class="math-display" style="display:block;text-align:center;margin:8px 0;font-style:italic;">${inner}</span>`;
        }
        return `<span class="math-inline" style="font-style:italic;">${inner}</span>`;
    } catch (err) {
        console.warn('[LaTeX] Render error, falling back to raw:', expr, err);
        return `<code class="latex-fallback" style="font-family:monospace;font-size:0.9em;color:#6366f1;">$${expr}$</code>`;
    }
}

/**
 * Detect if a string contains LaTeX markers or commands.
 */
export function hasLatex(text: string): boolean {
    return /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\(?:frac|sqrt|text|mathbf|alpha|beta|gamma|delta|theta|lambda|mu|sigma|omega|times|pm|leq|geq|neq|approx|infty|partial|nabla|Rightarrow|rightarrow|propto|overline|underline|vec|hat)\b/.test(text);
}

/**
 * renderLatexInHtml — Render all $...$ and $$...$$ inside an HTML string.
 * Only processes text nodes (splits on HTML tags to avoid corrupting attributes).
 *
 * @param html       HTML string (may contain LaTeX between tags)
 * @param fieldType  Context — controls display vs inline for $$...$$
 */
export function renderLatexInHtml(html: string, fieldType: FieldType = 'question'): string {
    if (!html || !hasLatex(html)) return html;

    const allowDisplay = fieldType === 'question' || fieldType === 'explanation';

    // Split on HTML tags — only process text chunks (even-indexed)
    const chunks = html.split(/(<[^>]+>)/);

    return chunks.map((chunk, i) => {
        if (i % 2 === 1) return chunk; // HTML tag — leave untouched
        if (!chunk) return chunk;

        // Process $$...$$ first (display mode)
        let processed = chunk.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) =>
            renderLatex(expr, allowDisplay)
        );

        // Then $...$ (always inline)
        processed = processed.replace(/\$([^$\n]+?)\$/g, (_, expr) =>
            renderLatex(expr, false)
        );

        return processed;
    }).join('');
}
