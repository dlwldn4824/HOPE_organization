import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { RewardShopTab, ShopItem } from '../types/reward';
import { RewardItemCard } from './RewardItemCard';

const CARD_CLASS =
  'min-w-0 overflow-hidden rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6';

const TABS: { id: RewardShopTab; label: string }[] = [
  { id: 'recommended', label: '추천' },
  { id: 'avatar', label: '아바타' },
  { id: 'decoration', label: '꾸미기' },
  { id: 'item', label: '아이템' },
  { id: 'other', label: '기타' },
];

interface RewardShopProps {
  isLoggedIn: boolean;
  items: ShopItem[];
}

export function RewardShop({ isLoggedIn, items }: RewardShopProps) {
  const [activeTab, setActiveTab] = useState<RewardShopTab>('recommended');

  const filteredItems =
    activeTab === 'recommended'
      ? items
      : items.filter((item) => item.category === activeTab);

  return (
    <article className={CARD_CLASS}>
      <div className="mb-4 flex min-w-0 items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-hope-green-light text-hope-green">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <h2 className="truncate text-lg font-bold text-hope-text">보상 상점</h2>
      </div>

      {!isLoggedIn ? (
        <p className="text-sm text-hope-sub">로그인 후 보상을 확인할 수 있어요.</p>
      ) : (
        <>
          <div className="mb-4 flex min-w-0 flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-hope-green text-white'
                    : 'bg-gray-100 text-hope-sub hover:bg-hope-green-light'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5 xl:gap-4">
            {filteredItems.map((item) => (
              <RewardItemCard key={item.id} item={item} onSelect={() => undefined} />
            ))}
          </div>
        </>
      )}
    </article>
  );
}
