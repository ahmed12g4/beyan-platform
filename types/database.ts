export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          thumbnail_url: string | null
          level: string | null
          course_type: string
          price: number
          duration_weeks: number | null
          schedule: string | null
          color: string | null
          is_published: boolean
          max_students: number | null
          teacher_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          thumbnail_url?: string | null
          level?: string | null
          course_type: string
          price?: number
          duration_weeks?: number | null
          schedule?: string | null
          color?: string | null
          is_published?: boolean
          max_students?: number | null
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          thumbnail_url?: string | null
          level?: string | null
          course_type?: string
          price?: number
          duration_weeks?: number | null
          schedule?: string | null
          color?: string | null
          is_published?: boolean
          max_students?: number | null
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      enrollments: {
        Row: {
          certificate_earned: boolean
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          last_accessed_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          certificate_earned?: boolean
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          certificate_earned?: boolean
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          last_accessed_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      },
      blog_posts: {
        Row: {
          category: string
          content: string
          created_at: string | null
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          published_at: string | null
          read_time: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          read_time?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          published_at?: string | null
          read_time?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_url: string
          course_name: string
          created_at: string
          id: string
          issue_date: string
          level: string | null
          student_id: string
          unique_number: string
        }
        Insert: {
          certificate_url: string
          course_name: string
          created_at?: string
          id?: string
          issue_date?: string
          level?: string | null
          student_id: string
          unique_number: string
        }
        Update: {
          certificate_url?: string
          course_name?: string
          created_at?: string
          id?: string
          issue_date?: string
          level?: string | null
          student_id?: string
          unique_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      },
      course_content: {
        Row: {
          course_id: string
          created_at: string
          downloads: number
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          uploaded_by: string | null
          views: number
          content_type: string
        }
        Insert: {
          course_id: string
          created_at?: string
          downloads?: number
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          uploaded_by?: string | null
          views?: number
          content_type: string
        }
        Update: {
          course_id?: string
          created_at?: string
          downloads?: number
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          uploaded_by?: string | null
          views?: number
          content_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_content_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      },
      comments: {
        Row: {
          author_name: string | null
          content: string
          created_at: string
          id: string
          rating: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          rating?: number | null
          status?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          rating?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_read: boolean | null
          message: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_read?: boolean | null
          message: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_read?: boolean | null
          message?: string
          subject?: string | null
        }
        Relationships: []
      }
      group_courses: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          issue_cert: boolean
          price: number
          schedule_desc: string
          session_duration_mins: number
          start_date: string
          teacher_id: string
          title: string
          total_seats: number
          updated_at: string
          zoom_link: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          issue_cert?: boolean
          price: number
          schedule_desc: string
          session_duration_mins?: number
          start_date: string
          teacher_id: string
          title: string
          total_seats: number
          updated_at?: string
          zoom_link: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          issue_cert?: boolean
          price?: number
          schedule_desc?: string
          session_duration_mins?: number
          start_date?: string
          teacher_id?: string
          title?: string
          total_seats?: number
          updated_at?: string
          zoom_link?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_enrollments: {
        Row: {
          enrolled_at: string
          group_course_id: string
          id: string
          student_id: string
        }
        Insert: {
          enrolled_at?: string
          group_course_id: string
          id?: string
          student_id: string
        }
        Update: {
          enrolled_at?: string
          group_course_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_enrollments_group_course_id_fkey"
            columns: ["group_course_id"]
            isOneToOne: false
            referencedRelation: "group_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_session_attendances: {
        Row: {
          attendance: string
          id: string
          session_id: string
          student_id: string
        }
        Insert: {
          attendance: string
          id?: string
          session_id: string
          student_id: string
        }
        Update: {
          attendance?: string
          id?: string
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_session_attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "group_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      group_sessions: {
        Row: {
          duration_mins: number
          group_course_id: string
          id: string
          session_date: string
          status: string
        }
        Insert: {
          duration_mins: number
          group_course_id: string
          id?: string
          session_date: string
          status?: string
        }
        Update: {
          duration_mins?: number
          group_course_id?: string
          id?: string
          session_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_sessions_group_course_id_fkey"
            columns: ["group_course_id"]
            isOneToOne: false
            referencedRelation: "group_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      individual_bookings: {
        Row: {
          attendance: string | null
          created_at: string
          end_time: string
          id: string
          start_time: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          attendance?: string | null
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          attendance?: string | null
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      },
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          is_completed: boolean
          last_position_seconds: number | null
          lesson_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          is_completed?: boolean
          last_position_seconds?: number | null
          lesson_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          is_completed?: boolean
          last_position_seconds?: number | null
          lesson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      },
      lessons: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free_preview: boolean
          is_published: boolean
          lesson_type: string
          meeting_link: string | null
          order_index: number
          scheduled_at: string | null
          status: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean
          is_published?: boolean
          lesson_type?: string
          meeting_link?: string | null
          order_index?: number
          scheduled_at?: string | null
          status?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean
          is_published?: boolean
          lesson_type?: string
          meeting_link?: string | null
          order_index?: number
          scheduled_at?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      },
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          sender_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          sender_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          sender_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          allow_new_registrations: boolean | null
          announcement_bar_enabled: boolean | null
          announcement_color: string | null
          announcement_marquee: boolean | null
          announcement_text: string | null
          announcement_text_color: string | null
          brand_accent_color: string | null
          brand_primary_color: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          favicon_url: string | null
          features_section: Json | null
          footer_copyright: string | null
          footer_description: string | null
          founder_section: Json | null
          google_analytics_id: string | null
          gratitude_section: Json | null
          gratitude_title: string | null
          hero_cta_link: string | null
          hero_cta_text: string | null
          hero_cta_visible: boolean | null
          hero_description: string | null
          hero_image_url: string | null
          hero_title: string | null
          how_it_works_section: Json | null
          how_it_works_subtitle: string | null
          how_it_works_title: string | null
          id: number
          logo_url: string | null
          maintenance_mode: boolean | null
          max_enrollments_per_user: number | null
          meta_pixel_id: string | null
          qr_code_url: string | null
          site_description: string | null
          site_name: string
          site_url: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_links: Json | null
          social_youtube: string | null
          stats_courses_count: number | null
          stats_satisfaction_rate: number | null
          stats_students_count: number | null
          student_terms: string | null
          student_tips: Json | null
          support_email: string | null
          teacher_terms: string | null
          teacher_tips: Json | null
          testimonials_section: Json | null
          updated_at: string
        }
        Insert: {
          allow_new_registrations?: boolean | null
          announcement_bar_enabled?: boolean | null
          announcement_color?: string | null
          announcement_marquee?: boolean | null
          announcement_text?: string | null
          announcement_text_color?: string | null
          brand_accent_color?: string | null
          brand_primary_color?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          favicon_url?: string | null
          features_section?: Json | null
          footer_copyright?: string | null
          footer_description?: string | null
          founder_section?: Json | null
          google_analytics_id?: string | null
          gratitude_section?: Json | null
          gratitude_title?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_cta_visible?: boolean | null
          hero_description?: string | null
          hero_image_url?: string | null
          hero_title?: string | null
          how_it_works_section?: Json | null
          how_it_works_subtitle?: string | null
          how_it_works_title?: string | null
          id?: number
          logo_url?: string | null
          maintenance_mode?: boolean | null
          max_enrollments_per_user?: number | null
          meta_pixel_id?: string | null
          qr_code_url?: string | null
          site_description?: string | null
          site_name?: string
          site_url?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_links?: Json | null
          social_youtube?: string | null
          stats_courses_count?: number | null
          stats_satisfaction_rate?: number | null
          stats_students_count?: number | null
          student_terms?: string | null
          student_tips?: Json | null
          support_email?: string | null
          teacher_terms?: string | null
          teacher_tips?: Json | null
          testimonials_section?: Json | null
          updated_at?: string
        }
        Update: {
          allow_new_registrations?: boolean | null
          announcement_bar_enabled?: boolean | null
          announcement_color?: string | null
          announcement_marquee?: boolean | null
          announcement_text?: string | null
          announcement_text_color?: string | null
          brand_accent_color?: string | null
          brand_primary_color?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          favicon_url?: string | null
          features_section?: Json | null
          footer_copyright?: string | null
          footer_description?: string | null
          founder_section?: Json | null
          google_analytics_id?: string | null
          gratitude_section?: Json | null
          gratitude_title?: string | null
          hero_cta_link?: string | null
          hero_cta_text?: string | null
          hero_cta_visible?: boolean | null
          hero_description?: string | null
          hero_image_url?: string | null
          hero_title?: string | null
          how_it_works_section?: Json | null
          how_it_works_subtitle?: string | null
          how_it_works_title?: string | null
          id?: number
          logo_url?: string | null
          maintenance_mode?: boolean | null
          max_enrollments_per_user?: number | null
          meta_pixel_id?: string | null
          qr_code_url?: string | null
          site_description?: string | null
          site_name?: string
          site_url?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_links?: Json | null
          social_youtube?: string | null
          stats_courses_count?: number | null
          stats_satisfaction_rate?: number | null
          stats_students_count?: number | null
          student_terms?: string | null
          student_tips?: Json | null
          support_email?: string | null
          teacher_terms?: string | null
          teacher_tips?: Json | null
          testimonials_section?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: string
          subscription_expires_at: string | null
          subscription_status: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: string
          subscription_expires_at?: string | null
          subscription_status?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: string
          subscription_expires_at?: string | null
          subscription_status?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string
          key: string
          reset_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          key: string
          reset_at: string
        }
        Update: {
          count?: number
          created_at?: string
          key?: string
          reset_at?: string
        }
        Relationships: []
      }
      recorded_course_enrollments: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          progress_percent: number
          student_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percent?: number
          student_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percent?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recorded_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "recorded_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recorded_course_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recorded_courses: {
        Row: {
          description: string | null
          id: string
          price: number
          title: string
          vimeo_folder_id: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          price: number
          title: string
          vimeo_folder_id?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          price?: number
          title?: string
          vimeo_folder_id?: string | null
        }
        Relationships: []
      }
      site_visits: {
        Row: {
          id: string
          visited_at: string | null
          visitor_id: string
        }
        Insert: {
          id?: string
          visited_at?: string | null
          visitor_id: string
        }
        Update: {
          id?: string
          visited_at?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      student_packages: {
        Row: {
          created_at: string
          id: string
          remaining_lessons: number
          student_id: string
          total_lessons: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          remaining_lessons?: number
          student_id: string
          total_lessons: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          remaining_lessons?: number
          student_id?: string
          total_lessons?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_packages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availabilities: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          teacher_id: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          teacher_id: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availabilities_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_wallets: {
        Row: {
          id: string
          paid_balance: number
          pending_balance: number
          teacher_id: string
        }
        Insert: {
          id?: string
          paid_balance?: number
          pending_balance?: number
          teacher_id: string
        }
        Update: {
          id?: string
          paid_balance?: number
          pending_balance?: number
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_wallets_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "teacher_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      enrollment_progress: {
        Row: {
          enrollment_id: string
          student_id: string
          course_id: string
          status: string
          enrolled_at: string
          completed_lessons: number
          total_lessons: number
          progress_percentage: number
        }
      }
    }
    Functions: {
      get_admin_broadcasts: {
        Args: { p_admin_id: string }
        Returns: {
          batch_id: string
          created_at: string
          message: string
          recipient_count: number
          title: string
          type: string
        }[]
      }
      get_recent_conversations: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          last_message_content: string
          last_message_created_at: string
          last_message_id: string
          last_message_sender_id: string
          role: string
          unread_count: number
          user_id: string
        }[]
      }
      get_user_role: { Args: never; Returns: string }
      send_broadcast: {
        Args: {
          p_batch_id: string
          p_link: string
          p_message: string
          p_sender_id: string
          p_target_role: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

/* ─── Consolidated Model Exports ─── */

// Base Table Rows
export type Course = Database['public']['Tables']['courses']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Enrollment = Database['public']['Tables']['enrollments']['Row'];
export type LessonProgress = Database['public']['Tables']['lesson_progress']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PlatformSettings = Database['public']['Tables']['platform_settings']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Comment = Database['public']['Tables']['comments']['Row'];
export type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
export type EnrollmentProgressRow = Database['public']['Views']['enrollment_progress']['Row'];

// Compound / Joined Types
export type CourseWithTeacher = Course & {
  teacher: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
};

export type CourseWithTeacherAndStats = CourseWithTeacher & {
  stats?: any;
  count?: number;
};

export type EnrollmentWithCourse = Enrollment & {
  course: Course;
};

export type EnrollmentProgress = EnrollmentProgressRow & {
  course?: Course;
};


