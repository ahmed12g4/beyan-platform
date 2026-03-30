import { DEFAULT_STUDENT_TERMS } from '@/lib/constants/terms'

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    content?: string;
}

export default function TermsModal({ isOpen, onClose, onAccept, content }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 transition-opacity">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-brand-primary">Kullanım Şartları ve Koşullar</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4 text-gray-700">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {content || DEFAULT_STUDENT_TERMS}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 bg-brand-primary text-white py-3 rounded-lg font-semibold hover:bg-brand-primary-hover transition-colors"
                    >
                        Kabul Ediyorum
                    </button>
                </div>
            </div>
        </div>
    );
}
