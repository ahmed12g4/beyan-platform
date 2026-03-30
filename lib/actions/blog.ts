'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Database } from '@/types/database'

export type BlogPost = Database['public']['Tables']['blog_posts']['Row']

import DOMPurify from 'isomorphic-dompurify'

/**
 * Server-side HTML sanitizer — strips dangerous tags and event handlers from
 * HTML content stored in the database before rendering it client-side.
 * This prevents XSS when content is rendered via dangerouslySetInnerHTML.
 */
function sanitizeHtml(html: string): string {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'span', 'blockquote', 'code', 'pre', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'u', 's'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    });
}


// Schema for Blog Post
const blogPostSchema = z.object({
    title: z.string().min(1, 'Başlık gereklidir').max(200),
    slug: z.string().min(1, 'Slug gereklidir').regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
    content: z.string().min(1, 'İçerik gereklidir'),
    excerpt: z.string().optional(),
    category: z.string().min(1, 'Kategori gereklidir'),
    image_url: z.string().optional().nullable(),
    is_published: z.boolean().default(false),
    read_time: z.string().optional(),
})

export type BlogPostInput = z.infer<typeof blogPostSchema>

export type ActionResult = {
    success: boolean
    error?: string
    message?: string
    data?: any
}

// ─── Get All Posts (Admin) ───
export async function getAdminBlogPosts() {
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum açmalısınız' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') return { success: false, error: 'Yetkisiz erişim' }

    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, data }
}

// ─── Get Single Post (Admin/Edit) ───
export async function getBlogPostById(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const supabase = await createClient();

    // Verify caller is authenticated and is an admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Oturum açmalısınız' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if ((profile as any)?.role !== 'admin') return { success: false, error: 'Yetkisiz erişim' };

    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, excerpt, category, image_url, is_published, read_time, created_at, updated_at, published_at')
        .eq('id', id)
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data };
}

// ─── Create/Update Post ───
export async function upsertBlogPost(id: string | null, input: BlogPostInput): Promise<ActionResult> {
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum açmalısınız' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') return { success: false, error: 'Yetkisiz erişim' }

    // Validate
    const validated = blogPostSchema.safeParse(input)
    if (!validated.success) {
        return { success: false, error: validated.error.issues[0].message }
    }

    const postData = {
        ...validated.data,
        updated_at: new Date().toISOString(),
        published_at: validated.data.is_published ? (input.is_published ? new Date().toISOString() : null) : null
    } as any

    let error;

    if (id && id !== 'new') {
        const { error: updateError } = await (supabase
            .from('blog_posts') as any)
            .update(postData)
            .eq('id', id)
        error = updateError
    } else {
        const { error: insertError } = await (supabase
            .from('blog_posts') as any)
            .insert(postData)
        error = insertError
    }

    if (error) {
        console.error('Blog Error:', error)
        if (error.code === '23505') return { success: false, error: 'Bu URL (slug) zaten kullanılıyor.' }
        return { success: false, error: error.message }
    }

    revalidatePath('/blog')
    revalidatePath('/admin/blog')

    return { success: true, message: 'Yazı başarıyla kaydedildi' }
}

// ─── Delete Post ───
export async function deleteBlogPost(id: string) {
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum açmalısınız' }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') return { success: false, error: 'Yetkisiz erişim' }

    const { error } = await supabase.from('blog_posts').delete().eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/blog')
    revalidatePath('/admin/blog')
    return { success: true, message: 'Yazı silindi' }
}

// ─── Public: Get Posts ───
export async function getPublicBlogPosts() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })

    if (error) {
        console.error('Public Blog Error:', error)
        return []
    }
    return data
}

// ─── Public: Get Single Post by Slug ───
export async function getPublicBlogPostBySlug(slug: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, content, excerpt, category, image_url, is_published, read_time, created_at, published_at')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

    if (error) return null;

    // Sanitize HTML content before returning to prevent XSS
    return {
        ...(data as any),
        content: sanitizeHtml((data as any).content ?? ''),
    } as any;
}
