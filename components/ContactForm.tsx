'use client'

import { useFormStatus } from 'react-dom'
import { submitContactForm } from '@/lib/actions/contact'
import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'

import { ContactFormState } from '@/lib/actions/contact'

const initialState: ContactFormState = {
    success: false,
    message: '',
    errors: {}
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-brand-accent text-brand-primary font-bold py-4 px-8 rounded-lg hover:bg-[#ffe57a] transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {pending ? (
                <>
                    <i className="fas fa-spinner fa-spin"></i> Gönderiliyor...
                </>
            ) : (
                'Mesajı Gönder'
            )}
        </button>
    )
}

export default function ContactForm() {
    const [state, formAction] = useActionState(submitContactForm, initialState)
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message)
                formRef.current?.reset()
            } else {
                toast.error(state.message)
            }
        }
    }, [state])

    return (
        <form ref={formRef} action={formAction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-gray-400 uppercase mb-2">
                        AD SOYAD
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        required
                        placeholder="Adınız Soyadınız"
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-[#FEDD59] transition-all"
                    />
                    {state.errors?.fullName && (
                        <p className="text-red-400 text-xs mt-1">{state.errors.fullName[0]}</p>
                    )}
                </div>
                <div>
                    <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase mb-2">
                        E-POSTA
                    </label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        placeholder="ornek@email.com"
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-[#FEDD59] transition-all"
                    />
                    {state.errors?.email && (
                        <p className="text-red-400 text-xs mt-1">{state.errors.email[0]}</p>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="subject" className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    KONU
                </label>
                <input
                    type="text"
                    name="subject"
                    id="subject"
                    placeholder="Mesajınızın konusu"
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-[#FEDD59] transition-all"
                />
            </div>

            <div>
                <label htmlFor="message" className="block text-xs font-bold text-gray-400 uppercase mb-2">
                    MESAJINIZ
                </label>
                <textarea
                    name="message"
                    id="message"
                    required
                    rows={5}
                    placeholder="Mesajınızı buraya yazın..."
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-[#FEDD59] transition-all resize-none"
                ></textarea>
                {state.errors?.message && (
                    <p className="text-red-400 text-xs mt-1">{state.errors.message[0]}</p>
                )}
            </div>

            <SubmitButton />
        </form>
    )
}
