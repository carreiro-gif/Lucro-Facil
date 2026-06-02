import React from 'react';

export const IFoodLogo = ({ className = "w-6 h-6 shrink-0" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} aria-label="iFood">
        <circle cx="50" cy="50" r="48" fill="#EA1D2C" />
        <ellipse cx="36" cy="38" rx="10" ry="14" fill="white" transform="rotate(-15 36 38)" />
        <ellipse cx="62" cy="38" rx="10" ry="14" fill="white" transform="rotate(-15 62 38)" />
        <path d="M 22 55 C 26 73, 56 75, 68 57" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
        <path d="M 68 57 L 57 59 L 65 47 Z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round" />
    </svg>
);

export const Food99Logo = ({ className = "w-6 h-6 shrink-0" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} aria-label="99Food">
        <defs>
            <linearGradient id="grad99" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF100" />
                <stop offset="100%" stopColor="#FF7A00" />
            </linearGradient>
        </defs>
        <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#grad99)" />
        <text x="50" y="70" fill="#000000" fontSize="56" fontWeight="900" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" letterSpacing="-4">99</text>
    </svg>
);

export const KeetaLogo = ({ className = "w-6 h-6 shrink-0" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} aria-label="Keeta">
        <rect x="0" y="0" width="100" height="100" rx="20" fill="#00B195" />
        <path d="M 0 0 L 100 0 L 100 62 C 100 82, 0 82, 0 62 Z" fill="#FFD800" />
        <text x="50" y="50" fill="black" fontSize="24" fontWeight="900" textAnchor="middle" fontFamily="'Arial Black', Gadget, sans-serif" letterSpacing="-1">keeta</text>
        <path d="M 22 55 C 32 68, 55 68, 62 58" fill="none" stroke="black" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="68" cy="55" r="2.5" fill="black" />
        <circle cx="73" cy="51" r="2.5" fill="black" />
    </svg>
);

export const WhatsAppLogo = ({ className = "w-6 h-6 shrink-0" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} aria-label="WhatsApp">
        <circle cx="50" cy="50" r="48" fill="#25D366" />
        <path d="M50 14 C30.1 14 14 30.1 14 50 C14 56.4 15.7 62.4 18.7 67.6 L14.5 83 L30.3 78.9 C35.2 81.6 40.8 83 46.5 83 L50 83 C69.9 83 86 66.9 86 47 C86 27.1 69.9 14 50 14 Z" fill="white" />
        <path d="M50 18 C32.3 18 18 32.3 18 50 C18 55.8 19.5 61.2 22.2 65.9 L19 77.5 L31 74.4 C35.5 76.9 40.7 78.2 46 78.2 L50 78.2 C67.7 78.2 82 63.9 82 46.2 C82 28.5 67.7 18 50 18 Z" fill="#25D366" />
        <path d="M63 56 C62 55.5 58 53.5 57 53 C56 52.8 55.5 52.5 55 53 C54.5 53.5 53 55.3 52.5 56 C52 56.5 51.5 56.8 50.5 56.2 C48 55 45.4 53.5 43.1 51.5 C41.2 49.8 39.7 47.9 39 46.8 C38.5 45.8 39 45.3 39.5 44.8 C40 44.3 40.5 43.7 41 43.2 C41.5 42.7 41.7 42.2 42 41.5 C42.2 41 42 40.2 41.8 39.8 C41.5 39.3 40 35.5 39.2 33.8 C38.5 32 37.8 32.2 37.2 32.2 C36.8 32.2 36.2 32.2 35.5 32.2 C34.8 32.2 33.8 32.5 33 33.2 C32.2 34 30.2 35.8 30.2 39.5 C30.2 43.2 32.8 46.8 33.2 47.2 C33.5 47.8 38.4 55.2 45.8 58.5 C47.5 59.2 49 59.8 50 60 C51.8 60.5 53.2 60.5 54.2 60.2 C55.5 60 58.2 58.5 58.8 56.8 C59.5 55 59.5 53.5 59.2 53.2 C59 52.8 58.5 52.5 57.5 52 Z" fill="white" />
    </svg>
);

export const getPlatformLogo = (name: string, className = "w-5 h-5 shrink-0 inline-block align-middle mr-1.5") => {
    const lower = name.toLowerCase();
    if (lower.includes('ifood')) {
        return <IFoodLogo className={className} />;
    }
    if (lower.includes('99') || lower.includes('99food')) {
        return <Food99Logo className={className} />;
    }
    if (lower.includes('keeta')) {
        return <KeetaLogo className={className} />;
    }
    if (lower.includes('whatsapp') || lower.includes('whats')) {
        return <WhatsAppLogo className={className} />;
    }
    return null;
};
