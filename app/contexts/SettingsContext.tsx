'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { PlatformSettings } from '@/types/database'

type SettingsContextType = {
    settings: PlatformSettings | null
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({
    children,
    settings: initialSettings,
}: {
    children: React.ReactNode
    settings: PlatformSettings | null
}) {
    const [settings, setSettings] = useState<PlatformSettings | null>(initialSettings)

    useEffect(() => {
        setSettings(initialSettings)
    }, [initialSettings])

    return (
        <SettingsContext.Provider value={{ settings }}>
            {children}
        </SettingsContext.Provider>
    )
}

export function useSettings() {
    const context = useContext(SettingsContext)
    // Return a default empty settings object if context is missing to prevent total crash, 
    // or keep the throw if strictness is preferred. Given the bug, a fallback is safer.
    if (context === undefined) {
        return { settings: null }
    }
    return context
}
