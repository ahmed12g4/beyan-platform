'use client'

import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import type { PlatformSettings } from '@/types/database'
import { SettingsProvider } from '@/app/contexts/SettingsContext'

export function Providers({ children, settings }: { children: React.ReactNode, settings: PlatformSettings | null }) {
  return (
    <ThemeProvider>
      <SettingsProvider settings={settings}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            },
            success: {
              iconTheme: { primary: '#FEDD59', secondary: '#204544' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </SettingsProvider>
    </ThemeProvider>
  )
}
