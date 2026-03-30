'use client'

import { useEffect, useRef } from 'react'
import { incrementVisitorCount } from '@/lib/actions/analytics'

export default function VisitorTracker() {
    const tracked = useRef(false)

    useEffect(() => {
        // Prevent double tracking in React Strict Mode
        if (tracked.current) return
        tracked.current = true

        const track = async () => {
            try {
                // Check local storage as a quick front-end guard to reduce server calls
                if (!localStorage.getItem('beyan_visitor')) {
                    const result = await incrementVisitorCount()
                    if (result?.success) {
                        localStorage.setItem('beyan_visitor', 'true')
                    }
                }
            } catch (err) {
                console.error('Visitor tracking failed', err)
            }
        }

        // Delay slightly to prioritize page load
        const timer = setTimeout(track, 3000)
        return () => clearTimeout(timer)
    }, [])

    return null
}
