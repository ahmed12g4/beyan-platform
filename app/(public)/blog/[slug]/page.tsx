import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPublicBlogPostBySlug } from '@/lib/actions/blog';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beyandilakademi.com';

interface Props {
  params: {
    slug: string;
  };
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublicBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Yazısı Bulunamadı | Beyan Dil Akademi',
    };
  }

  return {
    title: post.title + ' | Beyan Dil Akademi Blog',
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: siteUrl + '/blog/' + post.slug,
      images: post.image_url ? [{ url: post.image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.image_url ? [post.image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublicBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA] flex flex-col items-center pt-[60px] md:pt-[80px] pb-24 font-sans">
      {/* Blog Post Content */}
      <article className="max-w-4xl mx-auto px-5 w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Image */}
        {post.image_url && (
          <div className="relative w-full h-[300px] md:h-[450px]">
            <Image
              src={post.image_url}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-8">
              <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight">
                {post.title}
              </h1>
            </div>
          </div>
        )}

        <div className="p-8 md:p-12">
          {!post.image_url && (
            <h1 className="text-3xl md:text-5xl font-bold text-brand-primary mb-8">
              {post.title}
            </h1>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-500 mb-10 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-2">
              <i className="fas fa-calendar"></i>
              {new Date(post.created_at).toLocaleDateString('tr-TR')}
            </span>
            {post.category && (
              <span className="flex items-center gap-2">
                <i className="fas fa-tag"></i>
                {post.category}
              </span>
            )}
          </div>

          <div
            className="prose prose-lg prose-gray max-w-none prose-headings:text-brand-primary prose-a:text-brand-accent prose-img:rounded-xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </article>

      {/* Back button */}
      <div className="mt-12 text-center">
        <Link href="/blog" className="inline-flex items-center gap-2 px-8 py-4 bg-brand-primary text-white font-bold rounded-xl shadow-lg hover:bg-brand-primary/90 hover:scale-105 transition-all">
          <i className="fas fa-arrow-left"></i> Blog'a Dön
        </Link>
      </div>
    </main>
  );
}
