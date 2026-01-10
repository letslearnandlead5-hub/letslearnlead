import React from 'react';

interface MarkdownViewerProps {
    content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
    // Simple markdown parser for basic syntax
    const parseMarkdown = (text: string) => {
        if (!text) return '';

        let html = text;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

        // Links
        html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-primary-600 hover:underline">$1</a>');

        // Code blocks
        html = html.replace(/```(.*?)```/gis, '<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`(.*?)`/gim, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">$1</code>');

        // Lists
        html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>');
        html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');

        // Line breaks
        html = html.replace(/\n/gim, '<br />');

        return html;
    };

    return (
        <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        />
    );
};

export default MarkdownViewer;
