"use client";

export default function Loading() {
    return (
        <main className="min-h-screen bg-brand-primary pt-[100px] pb-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-accent"></div>
        </main>
    );
}
