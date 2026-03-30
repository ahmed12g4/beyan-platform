'use client'

import BlogList from '@/components/admin/BlogList'
import PageHeader from '@/components/admin/PageHeader'

export default function AdminBlogPage() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fadeIn">
            <PageHeader
                title="Blog Yönetimi"
                icon="fa-newspaper"
                subtitle="Sistemdeki yayınları ve blog yazılarını yönetin"
            />
            <BlogList />
        </div>
    )
}
