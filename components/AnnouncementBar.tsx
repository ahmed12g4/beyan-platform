"use client";

import { usePathname } from "next/navigation";

interface AnnouncementBarProps {
  text: string
  color: string
  textColor?: string
  marquee?: boolean
}

export function AnnouncementBar({ text, color, textColor, marquee }: AnnouncementBarProps) {
  const pathname = usePathname();

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Determine text color based on background brightness if not provided
  const isDark = (hexColor: string) => {
    // Remove # if present
    const hex = hexColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness < 128
  }

  const computedTextColor = textColor || (isDark(color) ? '#ffffff' : '#000000')

  return (
    <div
      className="w-full py-2 text-sm font-medium overflow-hidden relative z-50 transition-all"
      style={{ backgroundColor: color, color: computedTextColor }}
    >
      {marquee ? (
        <div className="w-full overflow-hidden flex items-center">
          <div className="animate-marquee whitespace-nowrap">
            <span className="inline-block px-4">{text}</span>
          </div>
        </div>
      ) : (
        <div className="text-center w-full px-4">
          {text}
        </div>
      )}
    </div>
  )
}
