import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownViewerProps {
    content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
    // Configure marked for security
    marked.setOptions({
        breaks: true,
        gfm: true,
    });

    // Parse and sanitize markdown
    const sanitizedHtml = useMemo(() => {
        if (!content) return '';

        // Convert markdown to HTML
        const rawHtml = marked(content) as string;

        // Sanitize HTML to prevent XSS
        return DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'p', 'br', 'strong', 'em', 'u', 's',
                'ul', 'ol', 'li',
                'a', 'code', 'pre',
                'blockquote', 'hr',
                'table', 'thead', 'tbody', 'tr', 'th', 'td'
            ],
            ALLOWED_ATTR: ['href', 'class', 'id'],
            ALLOW_DATA_ATTR: false,
        });
    }, [content]);

    return (
        <div
            className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4 prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2 prose-a:text-primary-600 prose-a:hover:underline prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-100 prose-pre:dark:bg-gray-800 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4 prose-li:ml-4"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};

export default MarkdownViewer;
