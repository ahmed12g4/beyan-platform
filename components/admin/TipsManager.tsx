'use client'

import React from 'react'
import { useFieldArray, Control } from 'react-hook-form'

interface TipsManagerProps {
    control: Control<any>
    name: "student_tips" | "teacher_tips"
    title: string
    description: string
    icon: string
    colorClass: string
}

export default function TipsManager({ control, name, title, description, icon, colorClass }: TipsManagerProps) {
    const { fields, append, remove, move } = useFieldArray({
        control,
        name,
    })

    return (
        <div className="bg-white p-8 rounded-lg border border-gray-100/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#edf1f1] text-[#204544] shrink-0">
                        <i className={`fas ${icon} text-xl`}></i>
                    </span>
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">{description}</p>
                    </div>
                </div>
                <div className="text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    Toplam: {fields.length} İpucu
                </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {fields.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <i className="fas fa-inbox text-4xl text-gray-300 mb-3 block"></i>
                        <p className="text-sm font-medium text-gray-500">Henüz hiç ipucu eklenmemiş.</p>
                    </div>
                )}

                {fields.map((field, index) => (
                    <div key={field.id} className="p-5 bg-gray-50/50 rounded-md border border-gray-200/80 hover:border-brand-primary/30 hover:bg-white transition-all group flex gap-4">
                        <div className="flex flex-col gap-2 pt-2 items-center">
                            <span className="w-8 h-8 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={() => index > 0 && move(index, index - 1)} className="text-gray-400 hover:text-brand-primary" disabled={index === 0}>
                                    <i className="fas fa-chevron-up"></i>
                                </button>
                                <button type="button" onClick={() => index < fields.length - 1 && move(index, index + 1)} className="text-gray-400 hover:text-brand-primary" disabled={index === fields.length - 1}>
                                    <i className="fas fa-chevron-down"></i>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Başlık Seçimi</label>
                                <input
                                    {...control.register(`${name}.${index}.title` as const)}
                                    className="w-full px-4 py-2.5 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary hover:border-gray-300 transition-colors font-bold text-gray-800"
                                    placeholder="Örn: Motivasyon"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">İçerik (Günün İpucu)</label>
                                <textarea
                                    {...control.register(`${name}.${index}.content` as const)}
                                    rows={2}
                                    className="w-full px-4 py-3 text-sm bg-white border border-gray-200/80 rounded-md focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary hover:border-gray-300 resize-none transition-colors"
                                    placeholder="Buraya günlük ipucu içeriğini yazın..."
                                />
                            </div>
                        </div>

                        <div className="pt-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"
                                title="Kaldır"
                            >
                                <i className="fas fa-trash-alt text-sm"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
                <button
                    type="button"
                    onClick={() => append({ title: '', content: '' })}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-all hover:border-gray-300"
                >
                    <i className="fas fa-plus-circle text-brand-primary"></i> Yeni İpucu Ekle
                </button>
            </div>
        </div>
    )
}
