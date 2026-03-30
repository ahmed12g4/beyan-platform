'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
    src?: string | null;
    name: string;
    size?: number;
    className?: string;
    alt?: string;
}

export default function Avatar({
    src,
    name,
    size = 40,
    className = "",
    alt
}: AvatarProps) {
    const [imageError, setImageError] = useState(false);

    // Standard platform colors from THEME_CONFIG
    const platformTeal = "#204544";
    const platformYellow = "#FEDD59";
    const placeholderGray = "#F3F4F6";

    const containerStyle = {
        width: size,
        height: size,
        border: `2px solid ${platformYellow}`,
        backgroundColor: placeholderGray,
        boxSizing: 'border-box' as const,
    };

    // Detect if the src is a placeholder (initials or dynamic placeholder service)
    const isPlaceholder = !src || src.length <= 3 || src.includes('ui-avatars.com') || src.includes('placeholder');
    
    const showImage = !isPlaceholder && !imageError;

    // Outer container common styles
    const containerClasses = `relative rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ${className}`;

    // If we have a real custom image, show it
    if (showImage && src) {
        return (
            <div className={containerClasses} style={containerStyle}>
                <Image
                    src={src}
                    alt={alt || name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                />
            </div>
        );
    }

    // Fallback: The exact professional silhouette matching the requested design
    return (
        <div
            className={containerClasses}
            style={containerStyle}
            title={name}
        >
            <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: size * 0.6, height: size * 0.6 }}
            >
                {/* Perfectly Centered professional silhouette */}
                <circle cx="12" cy="6.85" r="4.2" fill={platformTeal} />
                <path 
                    d="M12 12.85C8.1 12.85 4.5 15.85 4.5 20.15V21.35H19.5V20.15C19.5 15.85 15.9 12.85 12 12.85Z" 
                    fill={platformTeal} 
                />
            </svg>
        </div>
    );
}
