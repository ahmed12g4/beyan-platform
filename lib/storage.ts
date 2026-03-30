export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error(`Failed to save ${key} to localStorage`);
  }
}

export const STORAGE_KEYS = {
  REVIEWS: 'app_reviews',
  COURSES: 'app_courses',
  ANNOUNCEMENTS: 'app_announcements',
  MESSAGES: 'app_messages',
  USERS: 'app_users',
  SETTINGS: 'app_settings',
  THEME: 'app_theme',
} as const;

export interface Review {
  id: string;
  student: string;
  avatar: string;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  rating: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  level: string;
  price: string;
  duration: string;
  instructor: string;
}

export interface Announcement {
  id: string;
  content: string;
  target: string;
  image?: string;
  date: string;
  likes: number;
  comments: AnnouncementComment[];
}

export interface AnnouncementComment {
  id: string;
  author: string;
  text: string;
  date: string;
  replies: AnnouncementComment[];
}

export interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  whatsappEnabled: boolean;
  whatsappNumber: string;
  footerText: string;
}

export const defaultReviews: Review[] = [
  { id: '1', student: 'Ahmet Yılmaz', avatar: 'AY', comment: 'Çok faydalı bir kurs, herkese tavsiye ederim!', date: '2024-01-15', status: 'approved', rating: 5 },
  { id: '2', student: 'Elif Kaya', avatar: 'EK', comment: 'Eğitmenler çok ilgili ve yardımsever.', date: '2024-01-14', status: 'pending', rating: 4 },
  { id: '3', student: 'Mehmet Demir', avatar: 'MD', comment: 'Kurs içeriği güncellenmeli.', date: '2024-01-13', status: 'rejected', rating: 2 },
  { id: '4', student: 'Zeynep Arslan', avatar: 'ZA', comment: 'Harika bir deneyimdi, teşekkürler!', date: '2024-01-12', status: 'approved', rating: 5 },
  { id: '5', student: 'Can Öztürk', avatar: 'CÖ', comment: 'Fiyat/performans oranı çok iyi.', date: '2024-01-11', status: 'pending', rating: 4 },
];

export const defaultCourses: Course[] = [
  { id: '1', title: 'İngilizce A1 Başlangıç', description: 'Sıfırdan İngilizce öğrenmeye başlayın.', image: '', level: 'Başlangıç', price: '₺1,200', duration: '3 Ay', instructor: 'Ayşe Hoca' },
  { id: '2', title: 'İngilizce B1 Orta Seviye', description: 'Orta seviye İngilizce becerilerinizi geliştirin.', image: '', level: 'Orta', price: '₺1,500', duration: '4 Ay', instructor: 'Mehmet Hoca' },
  { id: '3', title: 'İngilizce C1 İleri Seviye', description: 'İleri seviye İngilizce konuşma ve yazma.', image: '', level: 'İleri', price: '₺2,000', duration: '6 Ay', instructor: 'Sarah Hoca' },
  { id: '4', title: 'IELTS Hazırlık Kursu', description: 'IELTS sınavına kapsamlı hazırlık.', image: '', level: 'İleri', price: '₺2,500', duration: '3 Ay', instructor: 'John Hoca' },
  { id: '5', title: 'Business English', description: 'İş İngilizcesi ve profesyonel iletişim.', image: '', level: 'Orta', price: '₺1,800', duration: '4 Ay', instructor: 'Emily Hoca' },
  { id: '6', title: 'Almanca A1 Başlangıç', description: 'Sıfırdan Almanca öğrenmeye başlayın.', image: '', level: 'Başlangıç', price: '₺1,300', duration: '3 Ay', instructor: 'Hans Hoca' },
];

export const defaultAnnouncements: Announcement[] = [
  {
    id: '1',
    content: 'Yeni dönem kayıtları başlamıştır! Erken kayıt indirimi için son gün 15 Şubat.',
    target: 'Tüm Kullanıcılar',
    date: '2024-01-15',
    likes: 12,
    comments: [
      { id: 'c1', author: 'Ahmet Y.', text: 'Harika haber!', date: '2024-01-15', replies: [] },
    ],
  },
  {
    id: '2',
    content: 'Online sınavlar artık mobil cihazlardan da yapılabilecek.',
    target: 'Öğrenciler',
    date: '2024-01-14',
    likes: 8,
    comments: [],
  },
];

export const defaultMessages: Message[] = [
  { id: '1', from: 'Ahmet Yılmaz', subject: 'Kurs hakkında soru', preview: 'Merhaba, İngilizce A1 kursu hakkında...', date: '2024-01-15', read: false },
  { id: '2', from: 'Elif Kaya', subject: 'Ödeme sorunu', preview: 'Ödeme yaparken bir sorunla karşılaştım...', date: '2024-01-14', read: false },
  { id: '3', from: 'Mehmet Demir', subject: 'Sertifika talebi', preview: 'Kursumu tamamladım, sertifikamı...', date: '2024-01-13', read: true },
  { id: '4', from: 'Zeynep Arslan', subject: 'Teşekkür', preview: 'Harika bir platform, teşekkür ederim...', date: '2024-01-12', read: true },
  { id: '5', from: 'Can Öztürk', subject: 'Grup dersi', preview: 'Grup dersleri ne zaman başlıyor?', date: '2024-01-11', read: false },
];

export const defaultUsers: User[] = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@email.com', role: 'Öğrenci', status: 'Aktif', joinDate: '2024-01-01' },
  { id: '2', name: 'Elif Kaya', email: 'elif@email.com', role: 'Öğrenci', status: 'Aktif', joinDate: '2024-01-05' },
  { id: '3', name: 'Mehmet Demir', email: 'mehmet@email.com', role: 'Öğretmen', status: 'Aktif', joinDate: '2023-12-15' },
  { id: '4', name: 'Zeynep Arslan', email: 'zeynep@email.com', role: 'Öğrenci', status: 'Pasif', joinDate: '2023-11-20' },
  { id: '5', name: 'Can Öztürk', email: 'can@email.com', role: 'Öğrenci', status: 'Aktif', joinDate: '2024-01-10' },
];

export const defaultSettings: SiteSettings = {
  siteName: 'Beyan Dil Akademi',
  siteDescription: 'Online dil öğrenme platformu',
  contactEmail: 'info@beyandilakademi.com',
  contactPhone: '+90 212 555 0000',
  address: 'İstanbul, Türkiye',
  socialMedia: {
    facebook: 'https://facebook.com/beyandilakademi',
    instagram: 'https://instagram.com/beyandilakademi',
    twitter: 'https://twitter.com/beyandilakademi',
    youtube: 'https://youtube.com/beyandilakademi',
  },
  whatsappEnabled: true,
  whatsappNumber: '+905551234567',
  footerText: '© 2024 Beyan Dil Akademi. Tüm hakları saklıdır.',
};
