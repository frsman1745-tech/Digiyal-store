import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import QRScanner from '../../components/ui/QRScanner';

export default function QRScannerPage() {
  const { direction } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleScan = (result) => {
    try {
      const url = new URL(result);
      navigate(url.pathname + url.search);
    } catch {
      navigate(`/product/${result}`);
    }
  };

  return (
    <div className="px-4 max-w-lg mx-auto pt-6" style={{ direction }}>
      <QRScanner onScan={handleScan} />
    </div>
  );
}
