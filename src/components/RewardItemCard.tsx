import { Coins, Gem } from 'lucide-react';
import type { ShopItem } from '../types/reward';
import { PlaceholderBox } from './PlaceholderBox';

interface RewardItemCardProps {
  item: ShopItem;
  disabled?: boolean;
  onPurchase: (item: ShopItem) => void;
}

export function RewardItemCard({ item, disabled = false, onPurchase }: RewardItemCardProps) {
  const isOwned = Boolean(item.purchased);

  return (
    <button
      type="button"
      onClick={() => onPurchase(item)}
      disabled={disabled || isOwned}
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-shadow ${
        isOwned
          ? 'cursor-default border-hope-green/30 bg-hope-green-light/20 opacity-90'
          : 'border-slate-100 hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'
      }`}
    >
      <div className="relative">
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt={item.name}
            className="aspect-square w-full object-cover"
            draggable={false}
            onError={(e) => {
              if (!item.imageFallbackSrc) return;
              e.currentTarget.onerror = null;
              e.currentTarget.src = item.imageFallbackSrc;
            }}
          />
        ) : (
          <PlaceholderBox
            label="ITEM IMAGE"
            className="aspect-square w-full rounded-none border-x-0 border-t-0 text-[8px]"
          />
        )}
        {item.isNew && !isOwned ? (
          <span className="absolute left-2 top-2 rounded-full bg-hope-green px-2 py-0.5 text-[10px] font-bold text-white">
            NEW
          </span>
        ) : null}
        {isOwned ? (
          <span className="absolute right-2 top-2 rounded-full bg-hope-green px-2 py-0.5 text-[10px] font-bold text-white">
            보유
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <p className="truncate text-sm font-bold text-hope-text">{item.name}</p>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-hope-sub">
          {item.currency === 'coin' ? (
            <Coins className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Gem className="h-3.5 w-3.5 text-pink-400" />
          )}
          <span className="truncate">
            {isOwned
              ? '구매 완료'
              : `${item.price.toLocaleString()} ${item.currency === 'coin' ? '코인' : '보석'}`}
          </span>
        </p>
      </div>
    </button>
  );
}
