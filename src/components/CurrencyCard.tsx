import { useState } from 'react';
import { Coins, Gem } from 'lucide-react';
import { ChargeModal } from './ChargeModal';
import type { RewardCurrency } from '../types/reward';

interface CurrencyCardProps {
  type: RewardCurrency;
  amount: number;
  isLoggedIn: boolean;
  onCharge?: () => void;
}

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

export function CurrencyCard({ type, amount, isLoggedIn, onCharge }: CurrencyCardProps) {
  const isCoin = type === 'coin';
  const Icon = isCoin ? Coins : Gem;
  const title = isCoin ? '보유 코인' : '보유 보석';
  const buttonLabel = isCoin ? '코인 충전' : '보석 충전';

  return (
    <article className={CARD_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isCoin ? 'bg-amber-100 text-amber-600' : 'bg-pink-100 text-pink-500'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-hope-sub">{title}</p>
            {isLoggedIn ? (
              <p className="mt-1 truncate text-2xl font-extrabold text-hope-text sm:text-3xl">
                {amount.toLocaleString()}
              </p>
            ) : (
              <p className="mt-2 text-sm text-hope-sub">로그인 후 보상을 확인할 수 있어요.</p>
            )}
          </div>
        </div>
      </div>

      {isLoggedIn && (
        <button
          type="button"
          onClick={onCharge}
          className="mt-4 h-10 w-full rounded-xl border border-hope-green/30 bg-white text-sm font-bold text-hope-green transition-colors hover:bg-hope-green-light active:scale-[0.99]"
        >
          {buttonLabel}
        </button>
      )}
    </article>
  );
}

interface CurrencySummaryProps {
  isLoggedIn: boolean;
  coins: number;
  gems: number;
}

export function CurrencySummary({ isLoggedIn, coins, gems }: CurrencySummaryProps) {
  const [chargeCurrency, setChargeCurrency] = useState<RewardCurrency | null>(null);

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
        <CurrencyCard
          type="coin"
          amount={coins}
          isLoggedIn={isLoggedIn}
          onCharge={() => setChargeCurrency('coin')}
        />
        <CurrencyCard
          type="gem"
          amount={gems}
          isLoggedIn={isLoggedIn}
          onCharge={() => setChargeCurrency('gem')}
        />
      </section>

      {chargeCurrency && (
        <ChargeModal
          currency={chargeCurrency}
          isOpen
          onClose={() => setChargeCurrency(null)}
        />
      )}
    </>
  );
}
