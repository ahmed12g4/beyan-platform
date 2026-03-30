-- Seed original blog posts
INSERT INTO blog_posts (title, slug, category, read_time, excerpt, content, is_published, published_at, image_url)
VALUES 
(
    'Arapça Öğrenmeye Nereden Başlamalı?', 
    'arapca-ogrenmeye-nereden-baslamali', 
    'Dil Öğrenme', 
    '5 dk okuma',
    'Yeni bir dil öğrenmek heyecan verici ama bazen karmaşık olabilir. İşte Arapça yolculuğunuza başlamanız için en doğru adımlar.',
    '<p>Yeni bir dil öğrenmek heyecan verici ama bazen karmaşık olabilir. İşte Arapça yolculuğunuza başlamanız için en doğru adımlar.</p><h2>1. Alfabeyi Öğrenin</h2><p>Arapça öğrenmenin ilk adımı alfabeyi tanımaktır...</p>',
    TRUE,
    NOW(),
    NULL
),
(
    'Arapça Alfabe Öğrenmenin En Kolay Yolu',
    'arapca-alfabe-ogrenmenin-en-kolay-yolu',
    'Arapça Gramer',
    '4 dk okuma',
    'Arap alfabesi gözünüzü korkutmasın. Görsel hafıza teknikleri ile harfleri kısa sürede ve kalıcı olarak öğrenin.',
    '<p>Arap alfabesi gözünüzü korkutmasın. Görsel hafıza teknikleri ile harfleri kısa sürede ve kalıcı olarak öğrenin.</p>',
    TRUE,
    NOW(),
    NULL
),
(
    'Arapça Kelime Ezberleme Teknikleri',
    'arapca-kelime-ezberleme-teknikleri',
    'Çalışma Teknikleri',
    '7 dk okuma',
    'Kelime hazinenizi geliştirmek için bilimsel olarak kanıtlanmış hafıza tekniklerini ve günlük pratik yöntemlerini keşfedin.',
    '<p>Kelime hazinenizi geliştirmek için bilimsel olarak kanıtlanmış hafıza tekniklerini ve günlük pratik yöntemlerini keşfedin.</p>',
    TRUE,
    NOW(),
    NULL
),
(
    'Online Arapça Eğitim Neden Etkilidir?',
    'online-arapca-egitim-neden-etkilidir',
    'Online Eğitim',
    '6 dk okuma',
    'Esnek saatler, kişiselleştirilmiş içerik ve dijital kaynaklar ile online eğitimin geleneksel yöntemlere göre avantajları.',
    '<p>Esnek saatler, kişiselleştirilmiş içerik ve dijital kaynaklar ile online eğitimin geleneksel yöntemlere göre avantajları.</p>',
    TRUE,
    NOW(),
    NULL
),
(
    'Arapça Konuşma Becerisi Nasıl Geliştirilir?',
    'arapca-konusma-becerisi-nasil-gelistirilir',
    'Konuşma Pratiği',
    '5 dk okuma',
    'Sadece gramer bilmek yetmez. Akıcı konuşmak için günlük hayatta uygulayabileceğiniz basit ve etkili yöntemler.',
    '<p>Sadece gramer bilmek yetmez. Akıcı konuşmak için günlük hayatta uygulayabileceğiniz basit ve etkili yöntemler.</p>',
    TRUE,
    NOW(),
    NULL
),
(
    'Arapça Öğrenirken Yapılan Yaygın Hatalar',
    'arapca-ogrenirken-yapilan-yaygin-hatalar',
    'Rehber',
    '8 dk okuma',
    'Dil öğrenme sürecinde motivasyonunuzu düşürebilecek hatalardan kaçınarak daha hızlı ve verimli ilerleyin.',
    '<p>Dil öğrenme sürecinde motivasyonunuzu düşürebilecek hatalardan kaçınarak daha hızlı ve verimli ilerleyin.</p>',
    TRUE,
    NOW(),
    NULL
)
ON CONFLICT (slug) DO NOTHING;
