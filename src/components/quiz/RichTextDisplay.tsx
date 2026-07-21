import React from 'react';
import DOMPurify from 'dompurify';
import { cleanHtml } from '../../utils/htmlUtils';

interface RichTextDisplayProps {
    content: string;
    className?: string;
}

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        'b', 'i', 'u', 's', 'em', 'strong', 'sup', 'sub',
        'br', 'p', 'div', 'span', 'ul', 'ol', 'li',
        'img', 'mark',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['style', 'src', 'alt', 'class', 'align', 'width', 'height'],
    ALLOW_DATA_ATTR: false,
};

/**
 * RichTextDisplay — Safely renders rich-text HTML from the ScientificEditor.
 *
 * Pipeline:
 *   1. cleanHtml()     — decode entities, remove empty <p>/<div>/<br> tags
 *   2. DOMPurify       — XSS sanitization
 *   3. dangerouslySetInnerHTML — render cleaned, safe HTML
 *
 * If the content has no HTML tags, renders as plain text to avoid
 * unnecessary DOM overhead.
 */
const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ content, className = '' }) => {
    if (!content) return null;

    // Step 1: Clean HTML entities and remove junk tags
    const cleaned = cleanHtml(content);

    // Step 2: Detect if it is actually HTML
    const isHtml = /<[a-z][\s\S]*>/i.test(cleaned);

    // Plain text path — no dangerouslySetInnerHTML needed
    if (!isHtml) {
        return (
            <span className={`whitespace-pre-wrap break-words ${className}`}>
                {cleaned}
            </span>
        );
    }

    // Step 3: XSS sanitize
    const sanitizedHtml = DOMPurify.sanitize(cleaned, SANITIZE_CONFIG) as string;

    return (
        <div
            className={`rich-text-content prose prose-sm dark:prose-invert max-w-none break-words ${className}`}
            style={{ lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default RichTextDisplay;
