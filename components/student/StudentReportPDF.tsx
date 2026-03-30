'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ReportData {
    studentName: string;
    studentEmail: string;
    month: string;
    year: number;
    enrolledCourses: {
        title: string;
        instructor: string;
        progress: number;
        completedLessons: number;
        totalLessons: number;
    }[];
    totalCompletedLessons: number;
    totalHoursLearned: number;
    currentStreak: number;
    level: number;
    totalXP: number;
    activeCourses: number;
    platformName?: string;
}

interface Props {
    data: ReportData;
}

// Helper to fetch file and return base64 part only
const fetchAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // Format is "data:mime/type;base64,DATA"
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// For image, we need the full data URL format.
const loadImageDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP image error`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export default function StudentReportPDF({ data }: Props) {
    const [generating, setGenerating] = useState(false);

    const generatePDF = async () => {
        setGenerating(true);
        const toastId = toast.loading('Rapor hazırlanıyor...');

        try {
            // dynamic import
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.default;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            // Fetch fonts and load into jsPDF VFS
            const [robotoReq, robotoBoldReq] = await Promise.all([
                fetchAsBase64('/Roboto-Regular.ttf'),
                fetchAsBase64('/Roboto-Bold.ttf')
            ]);

            doc.addFileToVFS('Roboto-Regular.ttf', robotoReq);
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

            doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldReq);
            doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

            // Set default font to our new Roboto font with full Turkish char support
            doc.setFont('Roboto', 'normal');

            // Load Logo
            let logoDataUrl = null;
            try {
                logoDataUrl = await loadImageDataUrl('/assets/logo-new.png');
            } catch (err) {
                console.warn('Logo could not be loaded', err);
            }

            const pageW = 210;
            const pageH = 297;
            const margin = 20;
            const contentW = pageW - margin * 2;

            // ── Color Palette ──
            const teal = [32, 69, 68] as [number, number, number];
            const gold = [254, 221, 89] as [number, number, number];
            const lightTeal = [240, 247, 247] as [number, number, number];
            const gray = [107, 114, 128] as [number, number, number];
            const white = [255, 255, 255] as [number, number, number];
            const darkText = [17, 24, 39] as [number, number, number];
            const lightGray = [243, 244, 246] as [number, number, number];

            // ── HEADER BLOCK ──
            doc.setFillColor(...teal);
            doc.rect(0, 0, pageW, 55, 'F');
            doc.setFillColor(...gold);
            doc.rect(0, 52, pageW, 4, 'F');

            // Info text positions
            let textStartX = margin;

            if (logoDataUrl) {
                // Better, smaller sized logo, vertically aligned in header
                doc.addImage(logoDataUrl, 'PNG', margin, 15, 22, 22);
                textStartX = margin + 27; // Shift text so it doesn't overlap logo
            }

            doc.setTextColor(...white);
            doc.setFontSize(22);
            doc.setFont('Roboto', 'bold');
            doc.text(data.platformName || 'Beyan Dil Akademi', textStartX, 25);

            doc.setFontSize(10);
            doc.setFont('Roboto', 'normal');
            doc.setTextColor(255, 255, 255);
            doc.text('AYLIK İLERLEME RAPORU', textStartX, 34);

            // Month & Year badge
            const badgeText = `${data.month} ${data.year}`;
            doc.setFillColor(...gold);
            doc.roundedRect(pageW - margin - 35, 14, 35, 10, 3, 3, 'F');
            doc.setTextColor(...teal);
            doc.setFontSize(9);
            doc.setFont('Roboto', 'bold');
            doc.text(badgeText, pageW - margin - 17.5, 20.5, { align: 'center' });

            // Print date
            doc.setTextColor(200, 220, 220);
            doc.setFontSize(8);
            doc.setFont('Roboto', 'normal');
            doc.text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, margin, 46);

            // ── STUDENT INFO ──
            let y = 70;
            doc.setFillColor(...lightTeal);
            doc.roundedRect(margin, y, contentW, 24, 4, 4, 'F');

            doc.setTextColor(...teal);
            doc.setFontSize(14);
            doc.setFont('Roboto', 'bold');
            doc.text(data.studentName, margin + 8, y + 10);

            doc.setTextColor(...gray);
            doc.setFontSize(9);
            doc.setFont('Roboto', 'normal');
            doc.text(data.studentEmail, margin + 8, y + 18);

            // Level badge
            doc.setFillColor(...teal);
            doc.roundedRect(margin + contentW - 40, y + 4, 36, 16, 3, 3, 'F');
            doc.setTextColor(...white);
            doc.setFontSize(9);
            doc.setFont('Roboto', 'bold');
            doc.text(`Seviye ${data.level}`, margin + contentW - 22, y + 13.5, { align: 'center' });

            // ── STATS SECTION ──
            y += 34;
            doc.setTextColor(...darkText);
            doc.setFontSize(11);
            doc.setFont('Roboto', 'bold');
            doc.text('İSTATİSTİKLER', margin, y);

            // Gold underline
            doc.setFillColor(...gold);
            doc.rect(margin, y + 2, 30, 1.5, 'F');

            y += 10;
            const statBoxW = (contentW - 9) / 4;
            const stats = [
                { label: 'Tamamlanan\nDers', value: String(data.totalCompletedLessons) },
                { label: 'Öğrenme\nSaati', value: String(data.totalHoursLearned) },
                { label: 'Aktif\nKurs', value: String(data.activeCourses) },
                { label: 'Gün Serisi', value: String(data.currentStreak) },
            ];

            stats.forEach((stat, i) => {
                const bx = margin + i * (statBoxW + 3);
                doc.setFillColor(...white);
                doc.setDrawColor(229, 231, 235);
                doc.roundedRect(bx, y, statBoxW, 28, 3, 3, 'FD');

                doc.setFillColor(...teal);
                doc.roundedRect(bx, y, statBoxW, 2.5, 1.5, 1.5, 'F');

                doc.setTextColor(...teal);
                doc.setFontSize(18);
                doc.setFont('Roboto', 'bold');
                doc.text(stat.value, bx + statBoxW / 2, y + 15, { align: 'center' });

                doc.setTextColor(...gray);
                doc.setFontSize(7);
                doc.setFont('Roboto', 'normal');
                const lines = stat.label.split('\n');
                lines.forEach((line, li) => {
                    doc.text(line, bx + statBoxW / 2, y + 21 + li * 3.5, { align: 'center' });
                });
            });

            // ── XP PROGRESS BAR ──
            y += 36;
            doc.setFillColor(...lightTeal);
            doc.roundedRect(margin, y, contentW, 18, 3, 3, 'F');

            doc.setTextColor(...teal);
            doc.setFontSize(9);
            doc.setFont('Roboto', 'bold');
            doc.text(`Toplam XP: ${data.totalXP}`, margin + 6, y + 7);

            const barX = margin + 6;
            const barY = y + 11;
            const barW = contentW - 12;
            const barH = 4;
            const xpForLevel = (data.level - 1) ** 2 * 100;
            const xpForNext = data.level ** 2 * 100;
            const xpPct = Math.min(((data.totalXP - xpForLevel) / (xpForNext - xpForLevel)) * 100, 100);

            doc.setFillColor(200, 220, 220);
            doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');
            doc.setFillColor(...gold);
            doc.roundedRect(barX, barY, (barW * xpPct) / 100, barH, 2, 2, 'F');

            doc.setTextColor(...gray);
            doc.setFontSize(7);
            doc.setFont('Roboto', 'normal');
            doc.text(`Seviye ${data.level + 1}'e: %${Math.round(xpPct)}`, barX + barW, y + 7, { align: 'right' });

            // ── COURSES SECTION ──
            y += 26;
            doc.setTextColor(...darkText);
            doc.setFontSize(11);
            doc.setFont('Roboto', 'bold');
            doc.text('KURS İLERLEME DURUMU', margin, y);

            doc.setFillColor(...gold);
            doc.rect(margin, y + 2, 55, 1.5, 'F');

            y += 10;

            if (data.enrolledCourses.length === 0) {
                doc.setFillColor(...lightGray);
                doc.roundedRect(margin, y, contentW, 20, 3, 3, 'F');
                doc.setTextColor(...gray);
                doc.setFontSize(9);
                doc.setFont('Roboto', 'normal');
                doc.text('Henüz aktif kurs bulunmuyor.', pageW / 2, y + 12, { align: 'center' });
                y += 26;
            } else {
                data.enrolledCourses.slice(0, 5).forEach((course, idx) => {
                    const rowH = 22;
                    const isEven = idx % 2 === 0;

                    doc.setFillColor(...(isEven ? white : lightGray));
                    doc.setDrawColor(229, 231, 235);
                    doc.roundedRect(margin, y, contentW, rowH, 3, 3, isEven ? 'FD' : 'F');

                    doc.setTextColor(...darkText);
                    doc.setFontSize(9);
                    doc.setFont('Roboto', 'bold');
                    const shortTitle = course.title.length > 35 ? course.title.substring(0, 35) + '...' : course.title;
                    doc.text(shortTitle, margin + 6, y + 8);

                    doc.setTextColor(...gray);
                    doc.setFontSize(7.5);
                    doc.setFont('Roboto', 'normal');
                    doc.text(`Eğitmen: ${course.instructor}`, margin + 6, y + 14);

                    const pBarX = margin + contentW - 65;
                    const pBarW = 50;
                    const pBarY = y + 10;
                    const pBarH = 3.5;
                    const pct = Math.min(course.progress, 100);

                    doc.setFillColor(229, 231, 235);
                    doc.roundedRect(pBarX, pBarY, pBarW, pBarH, 1.5, 1.5, 'F');

                    const pColor = pct >= 80 ? [34, 197, 94] : pct >= 40 ? [...teal] : [...gold];
                    doc.setFillColor(pColor[0], pColor[1], pColor[2]);
                    if (pct > 0) {
                        doc.roundedRect(pBarX, pBarY, (pBarW * pct) / 100, pBarH, 1.5, 1.5, 'F');
                    }

                    doc.setTextColor(...teal);
                    doc.setFontSize(8);
                    doc.setFont('Roboto', 'bold');
                    doc.text(`%${pct}`, pBarX + pBarW + 3, y + 13.5);

                    y += rowH + 2;
                });
            }

            // ── MOTIVATIONAL FOOTER ──
            y = Math.max(y + 8, pageH - 55);

            doc.setFillColor(...teal);
            doc.rect(0, pageH - 42, pageW, 42, 'F');
            doc.setFillColor(...gold);
            doc.rect(0, pageH - 44, pageW, 3, 'F');

            doc.setTextColor(...white);
            doc.setFontSize(14);
            doc.setFont('Roboto', 'bold');
            doc.text('Harika İlerliyorsunuz! Konumsal başarılarınız devam edecek.', pageW / 2, pageH - 29, { align: 'center' });

            doc.setFontSize(8);
            doc.setFont('Roboto', 'normal');
            doc.setTextColor(200, 230, 228);
            doc.text(
                'Öğrenme yolculuğunuzda her gün bir adım daha ileriyorsunuz.',
                pageW / 2, pageH - 20,
                { align: 'center' }
            );

            doc.setTextColor(150, 190, 188);
            doc.setFontSize(7);
            doc.text(
                `Bu rapor Beyan Dil Akademi tarafından ${new Date().toLocaleDateString('tr-TR')} tarihinde otomatik olarak oluşturulmuştur.`,
                pageW / 2, pageH - 10,
                { align: 'center' }
            );

            // ── SAVE ──
            const fileName = `Beyan_Dil_Akademi_Rapor_${data.studentName.replace(/\s/g, '_')}_${data.month}_${data.year}.pdf`;
            doc.save(fileName);

            toast.success('Raporunuz indirildi! 🎉', { id: toastId });
        } catch (err) {
            toast.error('Rapor oluşturulurken bir hata oluştu.', { id: toastId });
            console.error('PDF Error:', err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <button
            onClick={generatePDF}
            disabled={generating}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-all active:scale-95 shadow-md shadow-[#204544]/20 hover:shadow-lg hover:-translate-y-0.5 group"
            title="Aylık ilerleme raporunu PDF olarak indir"
        >
            {generating ? (
                <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Hazırlanıyor...
                </>
            ) : (
                <>
                    <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF Rapor İndir
                </>
            )}
        </button>
    );
}
