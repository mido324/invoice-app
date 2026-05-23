import { useTranslation } from 'react-i18next';
import { X, Heart } from 'lucide-react';
import { dismissMilestone, currentMilestone } from '../utils/milestoneTracker';

const SUPPORT_URL = 'https://buymeacoffee.com/secureinvoice';

interface Props {
  onClose: () => void;
}

export default function MilestoneModal({ onClose }: Props) {
  const { t } = useTranslation();
  const count = currentMilestone();

  function handleDismiss() {
    dismissMilestone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-5 text-center animate-in">
        <button
          onClick={handleDismiss}
          className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
          <span className="text-3xl">🎉</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900">
          {t('milestoneTitle', { count })}
        </h2>

        <p className="text-sm text-gray-500 leading-relaxed">
          {t('milestoneBody')}
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDismiss}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl
                       bg-[#FFDD00] hover:bg-[#e6c800] text-gray-900
                       font-bold text-sm transition-colors"
          >
            <Heart size={16} />
            {t('milestoneCta')}
          </a>
          <button
            onClick={handleDismiss}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium"
          >
            {t('milestoneSkip')}
          </button>
        </div>
      </div>
    </div>
  );
}
