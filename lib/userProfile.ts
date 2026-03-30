export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserProfile {
    user_id: string;
    role: UserRole;
    avatar_url: string;
    // Keeping name and other fields as they are likely used for display convenience, 
    // but the core requirement is user_id, role, avatar_url
    name: string;
    email: string;
    phone: string;
}

// Helper to generate consistent avatar URLs - DEPRECATED (Client handles fallback)
export const getAvatarUrl = (name: string) => {
    return undefined;
};

// THE SINGLE SHARED MOCK USER (Singleton)
// Starts as Student 'Ahmet Yılmaz' by default
export const currentUser: UserProfile = {
    user_id: 'user-1',
    role: 'student',
    name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '+90 555 111 22 33',
    avatar_url: '', // Empty string to trigger fallback
};

// Subscriber System (Observer Pattern) for Instant Updates
const listeners: Set<() => void> = new Set();

export const subscribeToUserChanges = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export const updateCurrentUser = (updates: Partial<UserProfile>) => {
    Object.assign(currentUser, updates);
    listeners.forEach(l => l());
};

// Helper for other components to access without Hook (non-reactive)
export const getCurrentUser = () => ({ ...currentUser });
