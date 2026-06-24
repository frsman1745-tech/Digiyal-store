import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../utils/api';
import {
  Send,
  Eye,
  X,

  AlertCircle,
  Loader2,
  MessageSquare,
  Users,
  Type,
  FileText,
} from 'lucide-react';
import BackButton from '../../components/ui/BackButton';

const targets = [
  { value: 'all', labelKey: 'admin.broadcast.allStores' },
  { value: 'approved', labelKey: 'admin.broadcast.approvedOnly' },
  { value: 'trial', labelKey: 'admin.broadcast.trialPlan' },
  { value: 'basic', labelKey: 'admin.broadcast.basicPlan' },
  { value: 'advanced', labelKey: 'admin.broadcast.advancedPlan' },
  { value: 'pro', labelKey: 'admin.broadcast.proPlan' },
];

export default function AdminBroadcastPage() {
  const { t, direction } = useTranslation();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handlePreview = async () => {
    if (!subject.trim() || !body.trim()) return;
    try {
      const res = await api.get('/admin/broadcast/preview', {
        params: { target },
      });
      setPreview({
        subject,
        body,
        target,
        count: res.data.count || res.data.totalStores || 0,
      });
    } catch {
      setPreview({ subject, body, target, count: 0 });
    }
  };

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await api.post('/admin/broadcast', { subject, body, target });
      setResult(res.data.sent || res.data.count || res.data.totalStores || 0);
      setShowConfirm(false);
      setPreview(null);
    } catch {
      setError(t('common.error'));
    }
    setSending(false);
  };

  const resetForm = () => {
    setSubject('');
    setBody('');
    setTarget('all');
    setPreview(null);
    setResult(null);
    setError('');
  };

  if (result !== null) {
    return (
      <div className="p-4 max-w-3xl mx-auto pb-8" style={{ direction }}>
        <Helmet>
          <title>{t('admin.broadcast.title')} - {t('app.name')}</title>
        </Helmet>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
            <Send size={32} className="text-accent" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('admin.broadcast.sentTitle')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('admin.broadcast.sentMessage', { count: result })}
          </p>
          <button
            onClick={resetForm}
            className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors"
          >
            {t('admin.broadcast.sendAnother')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto pb-8" style={{ direction }}>
      <Helmet>
        <title>{t('admin.broadcast.title')} - {t('app.name')}</title>
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <BackButton fallback="/admin/dashboard" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t('admin.broadcast.title')}</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('admin.broadcast.subject')} ({subject.length})
            </label>
            <div className="relative">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                dir="rtl"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                placeholder={t('admin.broadcast.subjectPlaceholder')}
              />
            </div>
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${subject.length > 200 ? 'text-red-500' : 'text-gray-400'}`}>
                {subject.length}/200
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('admin.broadcast.body')} ({body.length})
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              dir="rtl"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-light text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-y"
              placeholder={t('admin.broadcast.bodyPlaceholder')}
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${body.length > 5000 ? 'text-red-500' : 'text-gray-400'}`}>
                {body.length}/5000
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.broadcast.target')}
            </label>
            <div className="space-y-2">
              {targets.map((tgt) => (
                <label
                  key={tgt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    target === tgt.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value={tgt.value}
                    checked={target === tgt.value}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t(tgt.labelKey)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={!subject.trim() || !body.trim()}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Eye size={17} /> {t('admin.broadcast.preview')}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!subject.trim() || !body.trim() || sending}
            className="px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {sending ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
            {t('admin.broadcast.send')}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {preview && (
          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <Eye size={16} /> {t('admin.broadcast.preview')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users size={15} />
                <span className="font-medium">{t('admin.broadcast.to')}:</span> {preview.count} {t('admin.broadcast.stores')}
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Type size={15} className="mt-0.5" />
                <span>
                  <span className="font-medium">{t('admin.broadcast.subject')}:</span> {preview.subject}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText size={15} className="mt-0.5" />
                <span className="font-medium">{t('admin.broadcast.body')}:</span>
              </div>
              <div
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-200 dark:border-gray-700"
                dir="rtl"
              >
                {preview.body}
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-dark-light rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">{t('admin.broadcast.confirmTitle')}</h3>
              <button onClick={() => setShowConfirm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t('admin.broadcast.confirmMessage')}
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-4 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{t('admin.broadcast.to')}:</span> {t(targets.find((t) => t.value === target)?.labelKey || '')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                <span className="font-medium">{t('admin.broadcast.subject')}:</span> {subject}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {sending && <Loader2 size={16} className="animate-spin" />}
                {t('admin.broadcast.confirmSend')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
