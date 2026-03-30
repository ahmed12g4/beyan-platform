interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export default function AdminCard({ children, className = '', padding = false }: AdminCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-100/80 transition-shadow hover:shadow-md relative overflow-hidden ${padding ? 'p-6 md:p-8' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
