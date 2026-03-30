import { Metadata } from 'next'
import FAQSection from '@/components/FAQSection'

export const metadata: Metadata = {
    title: 'Sıkça Sorulan Sorular | Beyan Dil Akademi',
    description: 'Beyan Dil Akademi hakkında merak edilen tüm sorular, eğitim sistemimiz, sınıflarımız ve teknik detaylar hakkında bilgi alın.',
}

export default function SSSPage() {
    return (
        <main className="min-h-screen pt-[65px] bg-[#F8F9FA]">
            <FAQSection />
        </main>
    )
}
