import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ fallback = '/', className = '' }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      title="رجوع"
    >
      <ArrowLeft size={20} className="text-gray-500" />
    </button>
  );
}
