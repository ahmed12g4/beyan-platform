'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { MetaPixel } from './MetaPixel';

interface AnalyticsWrapperProps {
    gaId?: string | null;
    pixelId?: string | null;
}

export const AnalyticsWrapper = ({ gaId, pixelId }: AnalyticsWrapperProps) => {
    const [hasConsent, setHasConsent] = useState(false);

    useEffect(() => {
        // Check for consent on mount and setup a listener for changes
        const checkConsent = () => {
            const consent = localStorage.getItem('beyan_cookie_consent');
            setHasConsent(consent === 'all');
        };

        checkConsent();

        // Optional: We can listen for storage events in case it changes in another tab
        window.addEventListener('storage', checkConsent);

        // This makes it work immediately when they click 'Accept All' without a full reload
        const observer = new MutationObserver(() => {
            checkConsent();
        });
        observer.observe(document.body, { attributes: true, childList: true, subtree: true });

        return () => {
            window.removeEventListener('storage', checkConsent);
            observer.disconnect();
        };
    }, []);

    // If no ids provided, render nothing
    if (!gaId && !pixelId) return null;

    // Render scripts only if consent is given
    return (
        <>
            {hasConsent && gaId && <GoogleAnalytics gaId={gaId} />}
            {hasConsent && pixelId && <MetaPixel pixelId={pixelId} />}
        </>
    );
};
