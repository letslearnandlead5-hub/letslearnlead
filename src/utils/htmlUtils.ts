/**
 * htmlUtils.ts — Shared utilities for HTML cleaning, entity decoding,
 * and match-pair normalization used across Admin and Student views.
 *
 * WHY THIS FILE EXISTS:
 * The ScientificEditor (contenteditable) emits HTML that may contain:
 *   • &nbsp; — non-breaking spaces inserted by browsers between words
 *   • <p></p> — empty paragraph wrappers added by execCommand
 *   • <br> — trailing line-breaks after block elements
 *   • <div></div> — Chrome wraps lines in <div> on Enter
 *   • Nested spans with redundant styling
 *
 * This file provides idempotent, safe utilities to normalize that HTML
 * BEFORE saving to MongoDB and BEFORE rendering to students.
 */

// ── HTML Entity Decoder ───────────────────────────────────────────────────────

const ENTITY_MAP: Record<string, string> = {
    '&nbsp;':   ' ',
    '&amp;':    '&',
    '&lt;':     '<',
    '&gt;':     '>',
    '&quot;':   '"',
    '&#39;':    "'",
    '&apos;':   "'",
    '&copy;':   '\u00A9',
    '&reg;':    '\u00AE',
    '&trade;':  '\u2122',
    '&hellip;': '\u2026',
    '&mdash;':  '\u2014',
    '&ndash;':  '\u2013',
    '&laquo;':  '\u00AB',
    '&raquo;':  '\u00BB',
};

/**
 * Decode common HTML entities to their Unicode equivalents.
 * Handles both named entities (&nbsp;) and numeric entities (&#160;).
 */
export function decodeHtmlEntities(html: string): string {
    if (!html) return '';

    // Named entities
    let decoded = html.replace(/&[a-zA-Z]+;/g, (entity) => ENTITY_MAP[entity] ?? entity);

    // Numeric decimal entities: &#160; -> char
    decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));

    // Numeric hex entities: &#x00A0; -> char
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    return decoded;
}

// ── HTML Cleaner ─────────────────────────────────────────────────────────────

/**
 * cleanHtml — Normalize rich text HTML before saving or rendering.
 *
 * What it REMOVES:
 *   • Empty block tags: <p></p>, <div></div>, <p><br></p>
 *   • Whitespace-only paragraphs: <p>   &nbsp;   </p>
 *   • Trailing <br> at end of blocks
 *   • Multiple consecutive non-breaking spaces
 *
 * What it PRESERVES:
 *   • <b>, <i>, <u>, <em>, <strong>, <sup>, <sub>  (formatting)
 *   • <mark>, <span style="...">                   (colors/highlights)
 *   • <img>                                        (inline diagrams)
 *   • <ul>, <ol>, <li>                             (lists)
 *   • <p>, <div>, <br> — ONLY when they have real content
 *
 * Safe to call multiple times (idempotent).
 */
export function cleanHtml(html: string): string {
    if (!html || typeof html !== 'string') return '';

    let clean = html;

    // 1. Remove empty block elements (empty or only whitespace/&nbsp;/br)
    clean = clean.replace(/<(p|div|li)[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi, '');

    // 2. Remove trailing <br> right before a closing block tag
    clean = clean.replace(/<br\s*\/?>\s*(<\/(p|div|li|ul|ol)>)/gi, '$1');

    // 3. Decode HTML entities (after removing empty tags to avoid decoding nothing)
    clean = decodeHtmlEntities(clean);

    // 4. Collapse multiple consecutive non-breaking spaces (\u00A0) to single space
    clean = clean.replace(/\u00A0{2,}/g, ' ');
    clean = clean.replace(/( \u00A0|\u00A0 )/g, ' ');

    // 5. Collapse runs of more than 2 normal spaces
    clean = clean.replace(/ {3,}/g, '  ');

    // 6. Trim leading/trailing whitespace
    clean = clean.trim();

    return clean;
}

// ── Plain Text Extractor ─────────────────────────────────────────────────────

/**
 * stripHtmlToText — Extract readable plain text from HTML.
 *
 * Designed for:
 *  • React Native <Text> components (cannot render HTML)
 *  • Quiz option dropdowns where plain text is needed
 *  • Validation (checking if a field is "empty")
 */
export function stripHtmlToText(html: string): string {
    if (!html || typeof html !== 'string') return '';

    let text = html;

    // Decode entities first
    text = decodeHtmlEntities(text);

    // Replace block elements with newline
    text = text.replace(/<\/(p|div|li)>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // Strip all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Collapse multiple newlines to max 2
    text = text.replace(/\n{3,}/g, '\n\n');

    // Collapse multiple spaces
    text = text.replace(/[ \t]+/g, ' ');

    // Remove leading/trailing whitespace per line
    text = text.split('\n').map((l) => l.trim()).join('\n');

    // Final trim
    text = text.trim();

    return text;
}

// ── Match Pair Normalizer ────────────────────────────────────────────────────

export interface MatchPairData {
    id: string;
    left: string;
    right: string;
    order: number;
}

let _pairCounter = 0;

/**
 * generatePairId — Stable, unique ID for a match pair.
 * Uses timestamp + counter to avoid collisions on rapid creation.
 */
export function generatePairId(): string {
    return `pair_${Date.now()}_${++_pairCounter}`;
}

/**
 * normalizeMatchPairs — Validate and normalize pairs before saving.
 *
 * What it does:
 *  1. Ensures every pair has a non-empty stable `id`
 *  2. Assigns sequential `order` based on current array position
 *  3. Cleans `left` and `right` HTML with cleanHtml()
 *  4. Does NOT filter out empty pairs (Mongoose no longer requires content)
 *
 * Returns a new array — never mutates input.
 */
export function normalizeMatchPairs(
    pairs: Array<Partial<MatchPairData>>
): MatchPairData[] {
    return pairs.map((pair, index) => ({
        id: pair.id && pair.id.trim() ? pair.id : generatePairId(),
        left: cleanHtml(pair.left ?? ''),
        right: cleanHtml(pair.right ?? ''),
        order: index,
    }));
}

/**
 * validateMatchPairs — Returns a list of validation errors for display.
 * Call this before saving, separate from normalizeMatchPairs.
 */
export function validateMatchPairs(pairs: MatchPairData[]): string[] {
    const errors: string[] = [];

    if (pairs.length < 2) {
        errors.push('At least 2 match pairs are required.');
    }

    pairs.forEach((pair, i) => {
        const leftText = stripHtmlToText(pair.left);
        const rightText = stripHtmlToText(pair.right);

        if (!leftText && !pair.left.includes('<img')) {
            errors.push(`Pair ${i + 1}: Column A (left) text is required.`);
        }
        if (!rightText && !pair.right.includes('<img')) {
            errors.push(`Pair ${i + 1}: Column B (right) text is required.`);
        }
    });

    // Check for duplicate IDs
    const ids = pairs.map((p) => p.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
        errors.push('Duplicate pair IDs detected. Please remove and re-add duplicated pairs.');
    }

    return errors;
}
