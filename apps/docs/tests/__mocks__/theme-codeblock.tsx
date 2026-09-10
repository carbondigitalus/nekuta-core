import React from 'react';

interface CodeBlockProps {
    children?: React.ReactNode;
    language?: string;
    title?: string;
}

export default function CodeBlock({
    children,
    language,
    title
}: CodeBlockProps) {
    return (
        <pre
            data-testid="code-block"
            data-language={language}
            data-title={title}
        >
            <code>{children}</code>
        </pre>
    );
}
