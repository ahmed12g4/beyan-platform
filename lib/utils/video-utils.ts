
/**
 * Utility to convert various video URLs (YouTube, Vimeo) into embeddable formats.
 * Handles:
 * - YouTube: watch?v=ID, youtu.be/ID, embed/ID
 * - Vimeo: vimeo.com/ID
 */
export function getEmbedUrl(url: string | null): string | null {
    if (!url) return null;

    // YouTube
    const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&autoplay=0`;
    }

    // Vimeo
    const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Direct Video Link (MP4, etc.)
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('supabase.co')) {
        return url;
    }

    return url;
}
