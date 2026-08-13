import React from 'react';
import DOMPurify from 'dompurify';
import { cleanHtml } from '../../utils/htmlUtils';
import { renderLatexInHtml, hasLatex, FieldType } from '../../utils/latexRenderer';

interface RichTextDisplayProps {
    content: string;
    className?: string;
    /**
     * fieldType controls LaTeX rendering mode:
     *  'question'    — $$...$$ renders as centered display block, $...$ inline
     *  'option'      — all LaTeX always inline (compact)
     *  'match'       — all LaTeX always inline (compact)
     *  'explanation' — $$...$$ centered, $...$ inline (same as question)
     * Default: 'question'
     */
    fieldType?: FieldType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SANITIZE_CONFIG: Record<string, any> = {
    ALLOWED_TAGS: [
        // Inline formatting
        'b', 'i', 'u', 's', 'em', 'strong', 'sup', 'sub', 'mark', 'code',
        // Blocks
        'br', 'p', 'div', 'span',
        // Lists
        'ul', 'ol', 'li',
        // Tables
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
        // Media
        'img',
        // Links
        'a',
        // Preformatted
        'pre', 'blockquote',
        // KaTeX / MathML output elements
        'math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'mtext',
        'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot',
        'mspace', 'mover', 'munder', 'munderover', 'menclose',
        'annotation', 'annotation-xml', 'mpadded', 'mphantom',
        // KaTeX SVG output elements
        'svg', 'g', 'path', 'line', 'rect', 'use',
    ],
    ALLOWED_ATTR: [
        'style', 'src', 'alt', 'class', 'align', 'width', 'height',
        'href', 'target', 'rel',
        'colspan', 'rowspan',
        // KaTeX / MathML / SVG attributes
        'xmlns', 'encoding', 'display',
        'aria-hidden', 'focusable', 'viewBox', 'd', 'fill', 'stroke',
        'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'x1', 'x2', 'y1', 'y2',
        'preserveAspectRatio',
    ],
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ['aria-hidden'],
};

/**
 * RichTextDisplay — Safely renders rich-text HTML and textbook-quality KaTeX math.
 */
const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
    content,
    className = '',
    fieldType = 'question',
}) => {
    if (!content) return null;

    // Step 1: Clean HTML entities and remove junk tags
    const cleaned = cleanHtml(content);

    // Step 2: Fast path — plain text with no HTML, no slashes, and no LaTeX
    const isHtml  = /\<[a-z][\s\S]*\>/i.test(cleaned);
    const isLatex = hasLatex(cleaned) || cleaned.includes('/');

    if (!isHtml && !isLatex) {
        return (
            <span className={`whitespace-pre-wrap break-words ${className}`}>
                {cleaned}
            </span>
        );
    }

    // Step 3: Render LaTeX and mathematical fractions using KaTeX
    const withLatex = isLatex ? renderLatexInHtml(cleaned, fieldType) : cleaned;

    // Step 4: XSS sanitize (KaTeX output elements are whitelisted)
    const sanitizedHtml = DOMPurify.sanitize(withLatex, SANITIZE_CONFIG) as unknown as string;

    return (
        <div
            className={`rich-text-content prose prose-sm dark:prose-invert max-w-none break-words ${className}`}
            style={{ lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default RichTextDisplay;
export type { RichTextDisplayProps };
