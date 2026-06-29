import { useEffect, useState } from 'react';
import { Coins, Gem, X } from 'lucide-react';
import { notifyDataUpdated } from '../hooks/useBackendResource';
import type { RewardCurrency } from '../types/reward';
import { chargeWallet, fetchChargePackages, type ChargePackage } from '../utils/rewardApi';

interface ChargeModalProps {
  currency: RewardCurrency;
  isOpen: boolean;
  onClose: () => void;
}

export function ChargeModal({ currency, isOpen, onClose }: ChargeModalProps) {
  const [packages, setPackages] = useState<ChargePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chargingId, setChargingId] = useState<string | null>(null);

  const isCoin = currency === 'coin';
  const Icon = isCoin ? Coins : Gem;
  const title = isCoin ? '코인 충전' : '보석 충전';

  useEffect(() => {
    if (!isOpen) return;

    void fetchChargePackages()
      .then((data) => setPackages(data[currency]))
      .catch(() => setPackages([]));
  }, [currency, isOpen]);

  const handleCharge = async (pack: ChargePackage) => {
    setChargingId(pack.id);
    setLoading(true);

    try {
      await chargeWallet(currency, pack.id);
      notifyDataUpdated();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : '충전에 실패했습니다.');
    } finally {
      setLoading(false);
      setChargingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="charge-modal-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-100 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isCoin ? 'bg-amber-100 text-amber-600' : 'bg-pink-100 text-pink-500'
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <h2 id="charge-modal-title" className="text-lg font-bold text-hope-text">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-hope-sub hover:bg-slate-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-sm text-hope-sub">데모용 무료 충전입니다. 하루 최대 3회까지 가능해요.</p>

          {packages.map((pack) => (
            <button
              key={pack.id}
              type="button"
              disabled={loading}
              onClick={() => void handleCharge(pack)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-gray-50 px-4 py-4 text-left transition-colors hover:border-hope-green/30 hover:bg-hope-green-light/30 disabled:opacity-50"
            >
              <span className="text-base font-bold text-hope-text">
                {pack.amount.toLocaleString()}
                {isCoin ? ' 코인' : ' 보석'}
              </span>
              <span className="text-sm font-semibold text-hope-green">
                {chargingId === pack.id ? '충전 중...' : pack.priceLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
