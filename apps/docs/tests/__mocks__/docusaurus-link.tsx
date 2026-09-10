import React from 'react';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
}

export default function Link({ to, children, ...rest }: LinkProps) {
    return (
        <a href={to} {...rest}>
            {children}
        </a>
    );
}
