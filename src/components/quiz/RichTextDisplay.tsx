import React from 'react';
import DOMPurify from 'dompurify';

interface RichTextDisplayProps {
    content: string;
    className?: string;
}

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        'b', 'i', 'u', 's', 'em', 'strong', 'sup', 'sub',
        'br', 'p', 'div', 'span', 'ul', 'ol', 'li',
        'img', 'mark',
    ],
    ALLOWED_ATTR: ['style', 'src', 'alt', 'class', 'align'],
    ALLOW_DATA_ATTR: false,
};

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ content, className = '' }) => {
    // Detect if content is HTML or just plain text
    const isHtml = /<[a-z][\s\S]*>/i.test(content);

    if (!isHtml) {
        return (
            <div className={`whitespace-pre-wrap ${className}`}>
                {content}
            </div>
        );
    }

    const sanitizedHtml = DOMPurify.sanitize(content, SANITIZE_CONFIG) as string;

    return (
        <div
            className={`prose prose-sm dark:prose-invert max-w-none break-words ${className}`}
            style={{
                lineHeight: '1.6',
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default RichTextDisplay;
