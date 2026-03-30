import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Beyan Dil Akademi',
        short_name: 'Beyan Dil Akademi',
        description: 'Online Arapça dil öğrenme platformu — modern ve interaktif.',
        start_url: '/student',
        display: 'standalone',
        background_color: '#204544',
        theme_color: '#204544',
        orientation: 'portrait-primary',
        lang: 'tr',
        categories: ['education', 'e-learning'],
        icons: [
            {
                src: '/assets/logo-new.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
            },
            {
                src: '/assets/logo-new.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        screenshots: [],
        shortcuts: [
            {
                name: 'Derslerim',
                url: '/student/courses',
                description: 'Kayıtlı derslerime git',
            },
            {
                name: 'Takvim',
                url: '/student/calendar',
                description: 'Ders takvimimi gör',
            },
        ],
    }
}
