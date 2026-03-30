# Admin Courses Dashboard - Phase 6

## Overview

Admin-only courses management dashboard with secure authentication, course listing, and publish/unpublish functionality.

---

## Implementation ✅

### Route

**File:** [app/(admin)/admin/courses/page.tsx](app/(admin)/admin/courses/page.tsx)

**URL:** `/admin/courses`

**Access:** Admin only

---

## Features

### 1. Authentication & Authorization ✅

**Function:** `verifyAdmin()`

```typescript
async function verifyAdmin() {
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Fetch all user roles (user may have multiple roles)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id)

  if (!roleData || roleData.length === 0) redirect('/')

  // Check if any role is "admin"
  const isAdmin = roleData.some((item) => {
    const roles = item.roles as unknown
    return (
      roles &&
      typeof roles === 'object' &&
      'name' in roles &&
      (roles as { name: string }).name === 'admin'
    )
  })

  // Redirect if not admin
  if (!isAdmin) redirect('/')

  return user
}
```

**Security:**
- ✅ Server-side authentication check
- ✅ Database role verification
- ✅ Handles multiple roles correctly (checks ALL roles)
- ✅ Uses `.some()` to find admin role
- ✅ Automatic redirect to home if not admin
- ✅ No client-side role logic

---

### 2. Fetch All Courses ✅

**Function:** `getAllCoursesAdmin()`

```typescript
async function getAllCoursesAdmin(): Promise<Course[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('courses')
    .select('id, title, slug, description, is_published, created_at')
    .order('created_at', { ascending: false })

  return data as Course[]
}
```

**Features:**
- ✅ Fetches ALL courses (published + unpublished)
- ✅ Ordered by creation date (newest first)
- ✅ Includes all necessary fields
- ✅ Admin-only access via RLS policies

---

### 3. Courses Table UI ✅

**Columns:**
1. **Başlık (Title)** - Course title + description preview
2. **Slug** - URL-friendly slug in code format
3. **Durum (Status)** - Published badge (Green) or Draft badge (Gray)
4. **Oluşturulma (Created)** - Turkish formatted date
5. **İşlemler (Actions)** - Edit + Toggle Publish buttons

**Status Badges:**
```typescript
// Published
<span className="bg-green-100 text-green-800">Yayında</span>

// Draft
<span className="bg-gray-100 text-gray-800">Taslak</span>
```

**Empty State:**
- Shows message when no courses exist
- Link to create first course

---

### 4. Toggle Publish Server Action ✅

**Function:** `toggleCoursePublish(formData: FormData)`

```typescript
async function toggleCoursePublish(formData: FormData) {
  'use server'

  const courseId = formData.get('courseId') as string

  // 1. Verify admin authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 2. Verify admin role (handles multiple roles)
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id)

  if (!roleData || roleData.length === 0) return

  // Check if any role is "admin"
  const isAdmin = roleData.some((item) => {
    const roles = item.roles as unknown
    return (
      roles &&
      typeof roles === 'object' &&
      'name' in roles &&
      (roles as { name: string }).name === 'admin'
    )
  })

  if (!isAdmin) return

  // 3. Get current course status
  const { data: course } = await supabase
    .from('courses')
    .select('is_published, slug')
    .eq('id', courseId)
    .single()

  // 4. Toggle is_published
  await supabase
    .from('courses')
    .update({ is_published: !course.is_published })
    .eq('id', courseId)

  // 5. Revalidate affected pages
  revalidatePath('/kurslar')
  revalidatePath(`/kurslar/${course.slug}`)
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin/courses')
}
```

**Revalidation:**
- ✅ `/kurslar` - Courses listing page
- ✅ `/kurslar/[slug]` - Individual course page
- ✅ `/sitemap.xml` - Sitemap (dynamic)
- ✅ `/admin/courses` - Admin dashboard (refresh table)

**Security:**
- ✅ Server action only
- ✅ Admin verification on every toggle
- ✅ No direct database access from client
- ✅ Form-based submission (CSRF protection)

---

### 5. Action Buttons ✅

**Edit Button:**
```typescript
<Link href={`/admin/courses/${course.id}/edit`}>
  Düzenle
</Link>
```

**Toggle Publish Button:**
```typescript
<form action={toggleCoursePublish}>
  <input type="hidden" name="courseId" value={course.id} />
  <button type="submit">
    {course.is_published ? 'Yayından Kaldır' : 'Yayınla'}
  </button>
</form>
```

**Button States:**
- **Published Course** → Gray button: "Yayından Kaldır"
- **Draft Course** → Green button: "Yayınla"

---

### 6. Statistics Cards ✅

**Three stat cards:**
1. **Toplam Kurs** - Total courses count
2. **Yayında** - Published courses (green)
3. **Taslak** - Draft courses (gray)

```typescript
<div>Toplam Kurs: {courses.length}</div>
<div>Yayında: {courses.filter(c => c.is_published).length}</div>
<div>Taslak: {courses.filter(c => !c.is_published).length}</div>
```

---

## Security Model

### Server-Side Only ✅

- ✅ All authentication checks on server
- ✅ No client-side role verification
- ✅ Server actions for mutations
- ✅ Supabase RLS as second layer

### Admin Verification Flow

```
User visits /admin/courses
  ↓
verifyAdmin() checks auth + role
  ↓
If not admin → redirect('/')
  ↓
If admin → render dashboard
```

### Toggle Publish Flow

```
User clicks "Yayınla" button
  ↓
Form submits to toggleCoursePublish()
  ↓
Server action verifies admin
  ↓
If admin → toggle is_published
  ↓
Revalidate affected pages
  ↓
Page refreshes with new status
```

---

## Database Access

### RLS Policies Applied

From migration `005_create_courses_seo_table.sql`:

```sql
-- Admin can view all courses
CREATE POLICY "Admin can view all courses"
  ON public.courses FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admin can update courses
CREATE POLICY "Admin can update courses"
  ON public.courses FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
```

**Double Security:**
1. Application-level: `verifyAdmin()` function
2. Database-level: RLS policies

---

## UI/UX Features

### Responsive Design
- ✅ Mobile-friendly table
- ✅ Horizontal scroll on small screens
- ✅ Responsive grid for stats cards

### Visual Hierarchy
- ✅ Color-coded status badges
- ✅ Hover states on table rows
- ✅ Clear action buttons
- ✅ Consistent brand colors (#204544)

### Empty State
- ✅ Helpful message when no courses
- ✅ Call-to-action to create first course

### Turkish Localization
- ✅ All labels in Turkish
- ✅ Turkish date formatting
- ✅ Turkish button text

---

## TypeScript Status

**Command:** `npx tsc --noEmit`

**Result:** ✅ **PASSED** (0 errors)

All types correctly defined:
- Course interface
- Server action parameters
- Supabase queries
- Form data handling

---

## Testing Checklist

### Authentication Tests
- [ ] Visit `/admin/courses` as non-authenticated user → redirects to home
- [ ] Visit `/admin/courses` as student → redirects to home
- [ ] Visit `/admin/courses` as teacher → redirects to home
- [ ] Visit `/admin/courses` as admin → shows dashboard ✅

### Course Display Tests
- [ ] All courses shown (published + unpublished)
- [ ] Courses ordered by newest first
- [ ] Published badge shows green for published courses
- [ ] Draft badge shows gray for unpublished courses
- [ ] Dates formatted in Turkish locale

### Toggle Publish Tests
- [ ] Click "Yayınla" on draft course → publishes course
- [ ] Click "Yayından Kaldır" on published course → unpublishes course
- [ ] Toggle updates status badge immediately
- [ ] Toggle revalidates `/kurslar` listing page
- [ ] Toggle revalidates course detail page
- [ ] Toggle revalidates sitemap

### Stats Cards Tests
- [ ] Total courses count correct
- [ ] Published count correct
- [ ] Draft count correct
- [ ] Stats update after toggle

---

## Future Enhancements

### 1. Bulk Actions
```typescript
// Select multiple courses
// Bulk publish/unpublish
// Bulk delete
```

### 2. Search & Filter
```typescript
// Search by title or slug
// Filter by published status
// Sort by different columns
```

### 3. Pagination
```typescript
// Show 20 courses per page
// Next/Previous navigation
```

### 4. Course Analytics
```typescript
// View count per course
// Enrollment count
// Last viewed date
```

### 5. Quick Edit
```typescript
// Inline editing for title/slug
// Save without full page navigation
```

---

## File Structure

```
app/
└── (admin)/
    └── admin/
        └── courses/
            ├── page.tsx              ← Dashboard (✅ Implemented)
            ├── new/
            │   └── page.tsx          ← Create course (TODO)
            └── [id]/
                └── edit/
                    └── page.tsx      ← Edit course (TODO)
```

---

## Related Files

- **Migration:** `supabase/migrations/005_create_courses_seo_table.sql`
- **Listing Page:** `app/kurslar/page.tsx`
- **Detail Page:** `app/kurslar/[slug]/page.tsx`
- **Middleware:** `middleware.ts` (role verification)

---

## Status

**Phase 6 - Step 1:** ✅ **COMPLETE**

**Created:** 2026-02-12

**Features:**
- ✅ Admin authentication & authorization
- ✅ Fetch all courses (published + unpublished)
- ✅ Responsive table UI with status badges
- ✅ Toggle publish/unpublish server action
- ✅ Statistics cards
- ✅ Edit button (route placeholder)
- ✅ Revalidation on status change
- ✅ TypeScript strict mode
- ✅ Server-side only (no client JS)

---

## Changelog

### 2026-02-12 - Multiple Roles Fix
- ✅ Fixed admin role check to handle multiple roles correctly
- ✅ Removed `.limit(1)` from role queries
- ✅ Uses `.some()` to check if ANY role is "admin"
- ✅ Applied fix to both `verifyAdmin()` and `toggleCoursePublish()`
- ✅ Prevents failure when user has multiple roles (e.g., student + admin)
- ✅ TypeScript compilation: ✅ PASSED (0 errors)
- ✅ No security regression - maintains all security checks

---

**Next Steps:**
- Create course form (`/admin/courses/new`)
- Edit course form (`/admin/courses/[id]/edit`)
- Delete course functionality
