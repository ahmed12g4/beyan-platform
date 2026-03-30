import { PrivatePackage, Group, RecordedCourse, Teacher } from '../types/academy_v2';

const MOCK_TEACHER: Teacher = {
    id: 't1',
    full_name: 'Ahmed Mansour',
    avatar_url: undefined
};

export const MOCK_PRIVATE_PACKAGES: PrivatePackage[] = [
    {
        id: 'p1',
        student_id: 's1',
        total_lessons: 12,
        remaining_lessons: 8,
        teacher: MOCK_TEACHER,
        status: 'ACTIVE'
    }
];

export const MOCK_GROUPS: Group[] = [
    {
        id: 'g1',
        title: 'Arapça Başlangıç Seviyesi (Grup A)',
        teacher: MOCK_TEACHER,
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-05-01'),
        days_of_week: [1, 3], // Mon, Wed
        session_time: '19:00',
        session_duration: 60,
        total_seats: 10,
        available_seats: 3,
        price: 1500,
        status: 'ONGOING'
    }
];

export const MOCK_RECORDED_COURSES: RecordedCourse[] = [
    {
        id: 'r1',
        title: 'Sıfırdan Arapça Alfabe ve Telaffuz',
        description: 'Arapça öğrenmeye en temelden, harflerden başlayın.',
        teacher: MOCK_TEACHER,
        total_lessons: 20,
        completed_lessons: 5,
        progress_percentage: 25,
        price: 450,
        status: 'IN_PROGRESS'
    }
];
