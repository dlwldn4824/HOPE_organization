const SHOP_ASSET_BASE = '/assets/보상상점';

function shopAsset(filename: string, fallback: string) {
  return {
    imageSrc: `${SHOP_ASSET_BASE}/${encodeURIComponent(filename)}`,
    imageFallbackSrc: `${SHOP_ASSET_BASE}/${fallback}`,
  };
}

export const SHOP_ITEM_ASSETS = {
  bunnyHairband: shopAsset('버니헤어아이템.png', 'shop-bunny-hairband.png'),
  hoodieYellow: shopAsset('노랑후드티아이템.png', 'shop-hoodie-yellow.png'),
  leonBackpack: shopAsset('리온백팩아이템.png', 'shop-leon-backpack.png'),
  gems10: shopAsset('보석10개아이템.png', 'shop-gems-10.png'),
  piyoHeadphone: shopAsset('헤드셋아이템.png', 'shop-piyo-headphone.png'),
  colorPalette: shopAsset('컬러팔레트아이템.png', 'shop-color-palette.png'),
  namePlate: shopAsset('이름표아이템.png', 'shop-name-plate.png'),
  starMic: shopAsset('별마이크아이템.png', 'shop-star-mic.png'),
  speechBubbleBlue: shopAsset('말풍선아이템.png', 'shop-speech-bubble-blue.png'),
  randomBox: shopAsset('랜덤아이템.png', 'shop-random-box.png'),
} as const;
