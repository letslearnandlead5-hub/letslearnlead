/**
 * latexRenderer.ts — Robust Mathematical LaTeX & Proper Fraction Converter
 *
 * Provides textbook-level mathematical typography:
 *  - Proper fractions (\frac{a+b}{c}) with horizontal fraction bar, numerator above denominator
 *  - Nested fractions (\frac{\frac{a}{b}}{\frac{c}{d}})
 *  - Square roots (\sqrt{x}, \sqrt{\frac{a}{b}})
 *  - Superscripts (x^2, x^{n+1}) and subscripts (H_2O, a_i)
 *  - Greek letters (\alpha, \beta, \theta, \pi, \omega...)
 *  - Math operators & relations (\pm, \times, \leq, \geq, \neq, \approx, \int, \sum...)
 *  - Context-aware plain-text division converter (x = (a+b)/c, y = a/b - c/d, 1/2, 3/4)
 *    while preserving non-math slashes (10 km/h, 5 kg/m, 2025/26, and/or, URLs, HTML tags)
 *  - Pure zero-dependency resilient architecture (uses KaTeX from CDN/window when present,
 *    with instant built-in HTML/CSS math fallback so builds NEVER fail).
 */

export type FieldType = 'question' | 'option' | 'match' | 'explanation';

// ── Non-mathematical slash patterns to protect ────────────────────────────────
const NON_MATH_UNITS = [
    'km/h', 'm/s', 'm/s\\^2', 'm/s^2', 'kg/m', 'kg/m\\^3', 'kg/m^3',
    'g/cm\\^3', 'g/cm^3', 'mol/L', 'mol/l', 'rad/s', 'V/m', 'N/m',
    'J/K', 'W/m\\^2', 'W/m^2', 'cal/g', 'J/kg', 'km/s', 'cm/s',
    'mg/L', 'mg/l', 'cup', 'cups', 'tsp', 'tbsp'
];

const NON_MATH_WORDS = [
    'and/or', 'true/false', 'yes/no', 'input/output', 'either/or',
    'on/off', 'in/out', 'AC/DC', 'NEET/JEE', 'JEE/NEET', 'pass/fail',
    'male/female', 'w/o', 'c/o', 'b/w'
];

const GREEK_MAP: Record<string, string> = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε',
    zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ',
    lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
    rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ',
    chi: 'χ', psi: 'ψ', omega: 'ω',
    Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε',
    Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ',
    Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
    times: '×', div: '÷', pm: '±', mp: '∓', cdot: '·',
    leq: '≤', geq: '≥', neq: '≠', approx: '≈', infty: '∞',
    partial: '∂', nabla: '∇', sum: '∑', int: '∫', prod: '∏',
    rightarrow: '→', Rightarrow: '⇒', leftarrow: '←', Leftarrow: '⇐',
    leftrightarrow: '↔', Leftrightarrow: '⇔', degree: '°', circ: '°',
};

/**
 * Checks if a slash at a position represents a non-math unit, date, word, or URL.
 */
function isNonMathSlashContext(fullText: string, slashIndex: number): boolean {
    const windowStart = Math.max(0, slashIndex - 20);
    const windowEnd = Math.min(fullText.length, slashIndex + 20);
    const windowText = fullText.slice(windowStart, windowEnd);

    // 1. URLs and file paths
    if (/https?:\/\//i.test(fullText.slice(Math.max(0, slashIndex - 10), slashIndex + 10))) return true;
    if (/<\/?(?:a|span|div|p|img|table|tr|td|th)\b/i.test(windowText)) return true;

    // 2. Dates / academic years (e.g. 2025/26, 2026/2027, 12/05/2024)
    if (/\b\d{1,4}\/\d{2,4}\b/.test(windowText)) {
        const dateMatch = windowText.match(/\b\d{1,4}\/\d{2,4}\b/);
        if (dateMatch) {
            const relSlash = slashIndex - windowStart;
            const matchStart = windowText.indexOf(dateMatch[0]);
            const matchEnd = matchStart + dateMatch[0].length;
            if (relSlash >= matchStart && relSlash <= matchEnd) return true;
        }
    }

    // 3. Known non-math units (e.g. 10 km/h, 5 kg/m)
    for (const unit of NON_MATH_UNITS) {
        const regex = new RegExp(`\\b(?:\\d+(?:\\.\\d+)?\\s*)?${unit.replace(/[\^]/g, '\\^')}\\b`, 'i');
        if (regex.test(windowText)) return true;
    }

    // 4. Known slash word pairs (e.g. and/or, NEET/JEE)
    for (const word of NON_MATH_WORDS) {
        if (windowText.toLowerCase().includes(word.toLowerCase())) return true;
    }

    // 5. Recipe / non-math measurements like "1/2 cup", "1/4 tsp"
    if (/\b\d+\/\d+\s+(?:cup|cups|tsp|tbsp|spoon|spoons|drop|drops|tablet|tablets|piece|pieces|slice|slices)\b/i.test(windowText)) {
        return true;
    }

    return false;
}

/**
 * convertPlainMathFractionsToLatex — Converts plain-text mathematical division into proper \frac{a}{b} LaTeX.
 */
export function convertPlainMathFractionsToLatex(text: string): string {
    if (!text || typeof text !== 'string') return text;
    if (!text.includes('/')) return text;

    const chunks = text.split(/(<[^>]+>)/);

    const processedChunks = chunks.map((chunk, chunkIdx) => {
        if (chunkIdx % 2 === 1) return chunk;
        if (!chunk.includes('/')) return chunk;

        let res = chunk;

        // Pattern 0: sqrt(a/b) -> \sqrt{a/b}
        res = res.replace(/\bsqrt\(([^()]+)\)/gi, (match, inner) => {
            const innerFrac = convertPlainMathFractionsToLatex(inner);
            return `\\sqrt{${innerFrac}}`;
        });

        // Pattern 1: Parentheses / Parentheses: (a + b) / (c + d) -> \frac{a + b}{c + d}
        res = res.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, (match, num, den, offset) => {
            if (isNonMathSlashContext(chunk, offset)) return match;
            return `\\frac{${num.trim()}}{${den.trim()}}`;
        });

        // Pattern 2: Parentheses / Simple: (a + b) / c -> \frac{a + b}{c}
        res = res.replace(/\(([^()]+)\)\s*\/\s*([a-zA-Z0-9_\^]+)/g, (match, num, den, offset) => {
            if (isNonMathSlashContext(chunk, offset)) return match;
            return `\\frac{${num.trim()}}{${den.trim()}}`;
        });

        // Pattern 3: Simple / Parentheses: a / (b + c) -> \frac{a}{b + c} or x^2 / (2m) -> \frac{x^2}{2m}
        res = res.replace(/([a-zA-Z0-9_\^]+)\s*\/\s*\(([^()]+)\)/g, (match, num, den, offset) => {
            if (isNonMathSlashContext(chunk, offset)) return match;
            return `\\frac{${num.trim()}}{${den.trim()}}`;
        });

        // Pattern 4: Simple algebraic / numeric division in equations or math contexts
        res = res.replace(/(?:([a-zA-Z0-9_\^]+)\s*\/\s*([a-zA-Z0-9_\^]+))/g, (match, num, den, offset) => {
            if (isNonMathSlashContext(chunk, offset)) return match;

            const isNumValid = /^[a-zA-Z0-9_\^\+\-]+$/.test(num.trim());
            const isDenValid = /^[a-zA-Z0-9_\^\+\-]+$/.test(den.trim());

            if (isNumValid && isDenValid) {
                if (num.length > 3 && den.length > 3 && isNaN(Number(num)) && isNaN(Number(den))) {
                    return match;
                }
                return `\\frac{${num.trim()}}{${den.trim()}}`;
            }
            return match;
        });

        return res;
    });

    return processedChunks.join('');
}

/**
 * Detect if a string contains LaTeX markers or mathematical notation.
 */
export function hasLatex(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    return (
        /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\(?:frac|sqrt|text|mathrm|mathbf|boldsymbol|alpha|beta|gamma|delta|theta|lambda|mu|sigma|omega|times|pm|mp|div|cdot|leq|geq|neq|approx|infty|partial|nabla|sum|int|prod|rightarrow|Rightarrow|leftarrow|Leftarrow|rightleftharpoons|propto|vec|hat|bar|overline)\b/.test(text) ||
        /(?:[a-zA-Z]\s*=\s*[^,;]+|\b\d+\/\d+\b|\\frac\{|\^\{|_\{)/.test(text)
    );
}

// ── Balanced-brace argument extractor ────────────────────────────────────────
/**
 * Walk `str` starting at `pos` (which must be the opening `{`) and return
 * the content inside the matching closing `}` plus the index after it.
 * Returns null if `str[pos]` is not `{`.
 */
function extractBracedArg(str: string, pos: number): { content: string; end: number } | null {
    if (str[pos] !== '{') return null;
    let depth = 0;
    let start = pos + 1;
    for (let i = pos; i < str.length; i++) {
        if (str[i] === '{') depth++;
        else if (str[i] === '}') {
            depth--;
            if (depth === 0) return { content: str.slice(start, i), end: i + 1 };
        }
    }
    return null; // unbalanced braces
}

/**
 * Built-in zero-dependency HTML fraction & math renderer.
 */
function renderBuiltinMathHtml(expr: string, displayMode = false): string {
    let html = expr;

    // Greek letters & math symbols
    html = html.replace(/\\([a-zA-Z]+)/g, (match, cmd) => GREEK_MAP[cmd] || match);

    // Fractions: \frac{num}{den} — use balanced-brace extractor to avoid swap bug
    // We process iteratively so nested \frac inside num/den are handled recursively.
    let fracResult = '';
    let remaining = html;
    while (true) {
        const fracIdx = remaining.indexOf('\\frac{');
        if (fracIdx === -1) { fracResult += remaining; break; }
        // Append everything before \frac
        fracResult += remaining.slice(0, fracIdx);
        // Extract numerator (first braced arg)
        const numArg = extractBracedArg(remaining, fracIdx + 5); // +5 = length of '\frac'
        if (!numArg) { fracResult += remaining.slice(fracIdx); break; }
        // Extract denominator (second braced arg immediately after numerator)
        const denArg = extractBracedArg(remaining, numArg.end);
        if (!denArg) { fracResult += remaining.slice(fracIdx); break; }
        // Recursively render numerator and denominator
        const numHtml = renderBuiltinMathHtml(numArg.content);
        const denHtml = renderBuiltinMathHtml(denArg.content);
        // Build fraction HTML:
        //   numerator
        //   ─────────── (solid bar span — more reliable than border-bottom)
        //   denominator
        fracResult +=
            `<span class="math-frac" style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;font-size:0.9em;margin:0 3px;line-height:1.3;">` +
            `<span style="padding:0 3px 1px 3px;text-align:center;">${numHtml}</span>` +
            `<span style="display:block;width:100%;min-width:1em;height:1.5px;background:currentColor;flex-shrink:0;"></span>` +
            `<span style="padding:1px 3px 0 3px;text-align:center;">${denHtml}</span>` +
            `</span>`;
        remaining = remaining.slice(denArg.end);
    }
    html = fracResult;

    // Square roots: \sqrt{x}
    html = html.replace(/\\sqrt\{([^{}]*)\}/g, (_, inner) => {
        const innerHtml = renderBuiltinMathHtml(inner);
        return `<span style="font-size:1.1em;vertical-align:middle;">√</span><span style="border-top:1.5px solid currentColor;padding:0 2px;vertical-align:middle;">${innerHtml}</span>`;
    });

    // Superscripts & Subscripts
    html = html.replace(/\^\{([^}]+)\}|\^([a-zA-Z0-9\+\-])/g, (_, group, single) => `<sup>${group || single}</sup>`);
    html = html.replace(/_\{([^}]+)\}|_([a-zA-Z0-9\+\-])/g, (_, group, single) => `<sub>${group || single}</sub>`);

    if (displayMode) {
        return `<span class="math-display" style="display:block;text-align:center;margin:8px 0;font-style:italic;">${html}</span>`;
    }
    return `<span class="math-inline" style="font-style:italic;">${html}</span>`;
}

/**
 * Render a single LaTeX expression using KaTeX (if available) or built-in HTML fraction renderer.
 */
export function renderLatex(expr: string, displayMode = false): string {
    if (!expr) return '';
    const cleanExpr = expr.trim();

    // Check if global window.katex is loaded
    if (typeof window !== 'undefined' && (window as any).katex && typeof (window as any).katex.renderToString === 'function') {
        try {
            return (window as any).katex.renderToString(cleanExpr, {
                displayMode,
                throwOnError: false,
                strict: false,
                output: 'htmlAndMathml',
            });
        } catch {
            // fallback
        }
    }

    // High-fidelity built-in renderer
    return renderBuiltinMathHtml(cleanExpr, displayMode);
}

/**
 * renderLatexInHtml — Parse and render all LaTeX expressions in HTML.
 */
export function renderLatexInHtml(html: string, fieldType: FieldType = 'question'): string {
    if (!html || typeof html !== 'string') return '';

    const withFractions = convertPlainMathFractionsToLatex(html);
    const allowDisplay = fieldType === 'question' || fieldType === 'explanation';
    const chunks = withFractions.split(/(<[^>]+>)/);

    return chunks.map((chunk, i) => {
        if (i % 2 === 1) return chunk;
        if (!chunk || !chunk.trim()) return chunk;

        let processed = chunk;

        // 1. Render $$...$$ display math blocks
        processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
            return renderLatex(expr, allowDisplay);
        });

        // 2. Render $...$ inline math
        processed = processed.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
            return renderLatex(expr, false);
        });

        // 3. Render standalone LaTeX commands like \frac{a+b}{c} or \sqrt{x}
        //    Use a balanced-brace walk to find each \frac so we never mis-pair
        //    numerator and denominator (old fragile regex caused the swap bug).
        if (/\\(?:frac|sqrt|alpha|beta|gamma|delta|theta|lambda|mu|sigma|omega|times|pm|leq|geq|neq|approx)\b/.test(processed)) {
            // First handle \frac with balanced extractor
            let fracOut = '';
            let rem = processed;
            while (true) {
                const fi = rem.indexOf('\\frac{');
                if (fi === -1) { fracOut += rem; break; }
                fracOut += rem.slice(0, fi);
                const n = extractBracedArg(rem, fi + 5);
                if (!n) { fracOut += rem.slice(fi); break; }
                const d = extractBracedArg(rem, n.end);
                if (!d) { fracOut += rem.slice(fi); break; }
                // Reconstruct canonical \frac{num}{den} and let renderLatex handle it
                fracOut += renderLatex(`\\frac{${n.content}}{${d.content}}`, false);
                rem = rem.slice(d.end);
            }
            processed = fracOut;
            // Then handle \sqrt and Greek/operator symbols with simple regex
            processed = processed.replace(/(\\sqrt\{[^{}]*\}|\\(?:alpha|beta|gamma|delta|theta|lambda|mu|sigma|omega|times|pm|leq|geq|neq|approx)\b)/g, (match) => {
                return renderLatex(match, false);
            });
        }

        return processed;
    }).join('');
}
