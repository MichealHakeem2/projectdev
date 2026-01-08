"use client";

import React from 'react';
import Link from 'next/link';

interface RichTextProps {
    content: string;
    className?: string;
}

const RichText: React.FC<RichTextProps> = ({ content, className = "" }) => {
    if (!content) return null;

    // Split by whitespace but keep the matches
    const parts = content.split(/(\s+)/);

    return (
        <p className={`whitespace-pre-wrap ${className}`}>
            {parts.map((part, index) => {
                // Hashtag check
                if (part.startsWith('#') && part.length > 1) {
                    return (
                        <Link
                            key={index}
                            href={`/search?q=${encodeURIComponent(part)}`}
                            className="text-primary-500 hover:text-primary-600 font-bold hover:underline transition-all"
                        >
                            {part}
                        </Link>
                    );
                }

                // Mention check
                if (part.startsWith('@') && part.length > 1) {
                    return (
                        <Link
                            key={index}
                            href={`/search?q=${encodeURIComponent(part)}`}
                            className="text-indigo-500 hover:text-indigo-600 font-bold hover:underline transition-all"
                        >
                            {part}
                        </Link>
                    );
                }

                return <span key={index}>{part}</span>;
            })}
        </p>
    );
};

export default RichText;
