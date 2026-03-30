"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AvailabilitySlot {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_booked: boolean;
}

interface TeacherAvailabilityCalendarProps {
    teacherId: string;
    hasBalance: boolean;
    studentId?: string;
}

export default function TeacherAvailabilityCalendar({ teacherId, hasBalance, studentId }: TeacherAvailabilityCalendarProps) {
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [existingBookings, setExistingBookings] = useState<any[]>([]);

    const days = [
        { id: 0, name: 'Pazar' },
        { id: 1, name: 'Pazartesi' },
        { id: 2, name: 'Salı' },
        { id: 3, name: 'Çarşamba' },
        { id: 4, name: 'Perşembe' },
        { id: 5, name: 'Cuma' },
        { id: 6, name: 'Cumartesi' },
    ];

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await (supabase.from('teacher_availability') as any)
                .select('*')
                .eq('teacher_id', teacherId)
                .order('start_time', { ascending: true });

            if (error) {
                console.error("Error fetching availability:", error);
                return;
            }

            setSlots(data || []);

            // 2. Fetch Bookings for the next 14 days to filter slots
            const today = new Date().toISOString().split('T')[0];
            const future = new Date();
            future.setDate(future.getDate() + 14);
            const futureDate = future.toISOString().split('T')[0];

            const { data: bookingData } = await supabase
                .from('bookings')
                .select('booking_date, start_time')
                .eq('teacher_id', teacherId)
                .neq('status', 'cancelled')
                .gte('booking_date', today)
                .lte('booking_date', futureDate);

            setExistingBookings(bookingData || []);
        } catch (err: any) {
            console.error(err);
            setError("Müsaitlik takvimi yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailability();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teacherId]);

    const handleSlotClick = (slot: AvailabilitySlot) => {
        if (!hasBalance) {
            alert("Üzgünüz, rezervasyon yapabilmek için bir ders paketi satın almanız gerekiyor.");
            return;
        }

        if (slot.is_booked) return;

        setSelectedSlot(slot);
        setSuccessMessage(null);
    };

    const confirmBooking = async () => {
        if (!selectedSlot || !studentId) return;

        setBookingLoading(true);
        try {
            const supabase = createClient();

            // 1. Calculate an upcoming date for this day_of_week
            // Basic implementation: find next occurrence of the day
            const today = new Date();
            const currentDayOf = today.getDay(); // 0 is Sunday
            const targetDay = selectedSlot.day_of_week;

            let daysUntilTarget = targetDay - currentDayOf;
            if (daysUntilTarget <= 0) daysUntilTarget += 7; // Next week if it already passed or is today

            const bookingDate = new Date(today);
            bookingDate.setDate(today.getDate() + daysUntilTarget);
            const dateString = bookingDate.toISOString().split('T')[0];

            // 2. Insert Booking
            const { error: bookingError } = await (supabase.from('bookings') as any)
                .insert({
                    student_id: studentId,
                    teacher_id: teacherId,
                    booking_date: dateString,
                    start_time: selectedSlot.start_time,
                    end_time: selectedSlot.end_time,
                    status: 'confirmed'
                });

            if (bookingError) throw bookingError;

            // 3. Update Balance (decrement)
            const { error: balanceError } = await (supabase.rpc as any)('decrement_student_balance', {
                p_student_id: studentId,
                p_teacher_id: teacherId
            });
            // Fallback if custom RPC isn't deployed, do it manually:
            if (balanceError) {
                console.warn("RPC failed, trying manual update", balanceError);
                // First get current balance
                const { data: currentBalanceData } = await supabase
                    .from('student_lesson_balance')
                    .select('lessons_remaining')
                    .eq('student_id', studentId)
                    .eq('teacher_id', teacherId)
                    .single();

                if (currentBalanceData && (currentBalanceData as any).lessons_remaining > 0) {
                    await (supabase.from('student_lesson_balance') as any)
                        .update({ lessons_remaining: (currentBalanceData as any).lessons_remaining - 1 })
                        .eq('student_id', studentId)
                        .eq('teacher_id', teacherId);
                }
            }

            // 4. Send Notifications
            try {
                // Get teacher's user_id
                const { data: teacherRecord } = await supabase
                    .from('teachers')
                    .select('user_id')
                    .eq('id', teacherId)
                    .single();

                if (teacherRecord) {
                    // To Teacher
                    await (supabase.from('notifications' as any) as any).insert({
                        user_id: (teacherRecord as any).user_id,
                        title: 'Yeni Özel Ders Randevusu',
                        message: `Bir öğrenci ${dateString} tarihinde saat ${selectedSlot.start_time.substring(0, 5)} için randevu aldı.`,
                        type: 'BOOKING'
                    });
                }

                // To Admin
                const { data: adminProfiles } = await supabase.from('profiles').select('id').eq('role', 'admin');
                if (adminProfiles) {
                    const adminNotifs = adminProfiles.map((admin: any) => ({
                        user_id: admin.id,
                        title: 'Yeni Özel Ders Rezervasyonu',
                        message: `Bir öğrenci bir eğitmenle ${dateString} tarihi için randevu oluşturdu.`,
                        type: 'BOOKING'
                    }));
                    await (supabase.from('notifications' as any) as any).insert(adminNotifs);
                }
            } catch (notifErr) {
                console.error("Failed to send booking notifications:", notifErr);
            }

            setSuccessMessage("Başarıyla rezerve edildi! Onay bildirimi gönderildi.");
            setSelectedSlot(null);

            // Refresh calendar and potentially trigger parent balance refresh
            fetchAvailability();
            window.location.reload(); // Simplest way to refresh balance for now without context

        } catch (err) {
            console.error("Booking failed:", err);
            alert("Rezervasyon yapılırken bir hata oluştu. Lütfen tekrar deneyين.");
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    // Grouping slots by day
    const slotsByDay = days.map(day => {
        return {
            ...day,
            slots: slots.filter(s => s.day_of_week === day.id)
        };
    });

    return (
        <div>
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-6 flex items-center justify-between">
                    <div>
                        <i className="fas fa-exclamation-circle ml-2"></i>
                        {error}
                    </div>
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 mb-6 flex items-center justify-between">
                    <div>
                        <i className="fas fa-check-circle ml-2"></i>
                        {successMessage}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                {slotsByDay.map(day => (
                    <div key={day.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex flex-col h-full min-h-[250px]">
                        <div className="bg-gray-200/50 py-3 text-center border-b border-gray-200">
                            <span className="font-bold text-gray-700">{day.name}</span>
                            <div className="text-xs text-gray-400 mt-1">{day.slots.length} randevu</div>
                        </div>

                        <div className="p-3 flex flex-col gap-2 flex-1 overflow-y-auto">
                            {day.slots.length === 0 ? (
                                <div className="text-center text-gray-400 text-sm py-4 my-auto">
                                    Randevu yok
                                </div>
                            ) : (
                                day.slots.map(slot => {
                                    const timeStr = slot.start_time.substring(0, 5) + " - " + slot.end_time.substring(0, 5);

                                    // Calculate if this specific slot is booked for the UPCOMING week
                                    const today = new Date();
                                    const currentDayOf = today.getDay();
                                    let daysUntilTarget = slot.day_of_week - currentDayOf;
                                    if (daysUntilTarget <= 0) daysUntilTarget += 7;
                                    
                                    const bookingDate = new Date(today);
                                    bookingDate.setDate(today.getDate() + daysUntilTarget);
                                    const dateString = bookingDate.toISOString().split('T')[0];

                                    const isTaken = existingBookings.some(b => 
                                        b.booking_date === dateString && 
                                        (b.start_time.substring(0, 5) === slot.start_time.substring(0, 5))
                                    );

                                    if (slot.is_booked || isTaken) {
                                        return (
                                            <div key={slot.id} className="bg-gray-100 text-gray-400 p-2 rounded text-center text-sm font-medium border border-gray-200 flex flex-col gap-1 items-center justify-center relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiAvPgo8cGF0aCBkPSJNMCAwTDggOFoiIHN0cm9rZT0iI2U1ZTdlYiIHN0cm9rZS13aWR0aD0iMSIgLz4KPC9zdmc+')] opacity-50"></div>
                                                <span className="relative z-10 line-through opacity-70">{timeStr}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleSlotClick(slot)}
                                            className="bg-green-50 hover:bg-green-500 text-green-700 hover:text-white p-2 rounded text-center text-sm font-bold border border-green-200 hover:border-green-600 transition-colors shadow-sm cursor-pointer"
                                        >
                                            {timeStr}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Booking Confirmation Modal */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fadeIn">
                        <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                            <i className="far fa-calendar-check"></i>
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Rezervasyonu Onayla</h3>
                        <p className="text-center text-gray-600 mb-6 border-b border-gray-100 pb-6">
                            Bu randevuyu ayırtmak istediğinizden emin misiniz: <strong className="text-brand-primary">{days.find(d => d.id === selectedSlot.day_of_week)?.name}</strong> saat <strong dir="ltr">{selectedSlot.start_time.substring(0, 5)}</strong> ile <strong dir="ltr">{selectedSlot.end_time.substring(0, 5)}</strong> arası?
                        </p>

                        <div className="flex bg-amber-50 text-amber-700 p-3 rounded-lg text-sm mb-6 items-start gap-3 border border-amber-200">
                            <i className="fas fa-info-circle mt-0.5"></i>
                            <p>Onaylanır onaylanmaz mevcut bakiyenizden <strong>1</strong> ders düşülecektir.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={confirmBooking}
                                disabled={bookingLoading}
                                className="flex-1 bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {bookingLoading ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Rezerve ediliyor...</>
                                ) : (
                                    "Rezervasyonu Onayla"
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedSlot(null)}
                                disabled={bookingLoading}
                                className="bg-gray-100 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
