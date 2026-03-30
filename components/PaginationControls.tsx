'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface PaginationControlsProps {
    currentPage: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
}

export default function PaginationControls({
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
}: PaginationControlsProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', page.toString())
        router.push(`?${params.toString()}`)
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center gap-2 mt-12">
            <button
                disabled={!hasPrevPage}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-100/80 text-gray-500 hover:bg-gray-50 hover:text-brand-primary hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
                <i className="fas fa-chevron-left text-sm"></i>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first, last, current, and adjacent pages
                if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                    return (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm transition-all shadow-sm ${currentPage === page
                                ? 'bg-brand-primary text-brand-accent border-brand-primary shadow-md shadow-[#204544]/20'
                                : 'bg-white border border-gray-100/80 text-gray-500 hover:bg-gray-50 hover:text-brand-primary hover:border-gray-200'
                                }`}
                        >
                            {page}
                        </button>
                    )
                } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                ) {
                    return (
                        <span key={page} className="px-1 text-gray-400">
                            ...
                        </span>
                    )
                }
                return null
            })}

            <button
                disabled={!hasNextPage}
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-100/80 text-gray-500 hover:bg-gray-50 hover:text-brand-primary hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
                <i className="fas fa-chevron-right text-sm"></i>
            </button>
        </div>
    )
}
