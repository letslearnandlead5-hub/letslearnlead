declare module 'katex' {
    export interface KatexOptions {
        displayMode?: boolean;
        output?: 'html' | 'mathml' | 'htmlAndMathml';
        leqno?: boolean;
        fleqn?: boolean;
        throwOnError?: boolean;
        errorColor?: string;
        macros?: any;
        minRuleThickness?: number;
        colorIsTextColor?: boolean;
        maxSize?: number;
        maxExpand?: number;
        strict?: boolean | string | ((...args: any[]) => any);
        trust?: boolean | ((...args: any[]) => any);
        globalGroup?: boolean;
    }

    export function render(tex: string, element: HTMLElement, options?: KatexOptions): void;
    export function renderToString(tex: string, options?: KatexOptions): string;

    const katex: {
        render: typeof render;
        renderToString: typeof renderToString;
    };

    export default katex;
}

declare module 'katex/dist/katex.min.css';
