/**
 * MerryMe 프롬프트 템플릿
 * NanoBanana2 스타일: 따뜻하고 부드러운 필름 톤, 몽환적 빛 번짐
 */

const STYLE_PREFIX = `
Maintain the exact facial features, skin tone, body proportions and unique characteristics 
from the reference images. NanoBanana2 style: warm film tones, soft golden hour lighting, 
gentle bokeh background, dreamy light leaks, natural happy expressions, 
high-quality film camera texture.
`.trim();

export type SnapshotTheme =
  | 'cherry_blossom'
  | 'beach_sunset'
  | 'classic_studio'
  | 'forest_garden'
  | 'city_night'
  | 'autumn_park'
  | 'snowy_winter'
  | 'lavender_field'
  | 'rooftop_garden'
  | 'hanok_traditional';

const SNAPSHOT_THEMES: Record<SnapshotTheme, string> = {
  cherry_blossom: '만개한 벚꽃 나무 아래에서, 꽃잎이 흩날리는 봄날의 오후, 자연광',
  beach_sunset: '해변에서 석양이 지는 골든아워, 파도 소리가 들리는 로맨틱한 분위기',
  classic_studio: '클래식한 사진 스튜디오, 부드러운 스튜디오 조명, 크림색 배경',
  forest_garden: '울창한 숲 속 정원, 초록 덩굴과 야생화, 자연 채광이 나뭇잎 사이로 스며드는 모습',
  city_night: '도심 야경을 배경으로, 네온사인 반사, 시네마틱 느낌의 따뜻한 도시 야경',
  autumn_park: '단풍이 물든 가을 공원, 붉고 노란 낙엽이 흩날리는 따뜻한 오후 빛',
  snowy_winter: '하얀 눈이 내리는 겨울 풍경, 따뜻한 코트를 입고, 로맨틱한 눈 속 분위기',
  lavender_field: '보라색 라벤더 밭, 프로방스풍 따뜻한 햇살과 향기로운 꽃밭',
  rooftop_garden: '도심 루프탑 정원, 도시 스카이라인을 배경으로 한 로맨틱 가든 파티',
  hanok_traditional: '전통 한옥 마당, 한복을 입고, 고즈넉한 한국 전통 분위기',
};

export function buildSnapshotPrompt(theme: SnapshotTheme): string {
  return `
Create a couple's pre-wedding snapshot photo.
Scene: ${SNAPSHOT_THEMES[theme]}
The couple is posing naturally and lovingly — smiling, holding hands, or looking at each other.
Composition: Medium-to-full body shot, 4:3 aspect ratio.
${STYLE_PREFIX}
Generate one beautiful, high-quality image.
`.trim();
}

export type DressType = 'a_line' | 'mermaid' | 'ball_gown' | 'mini';
export type TuxedoType = 'classic_black' | 'navy' | 'white' | 'slim_fit';
export type MakeupType = 'natural' | 'glam' | 'vintage' | 'hanbok';

const DRESS_DESC: Record<DressType, string> = {
  a_line: 'elegant A-line wedding dress with delicate lace details and a flowing skirt',
  mermaid: 'sophisticated mermaid-cut wedding dress that hugs the body with a dramatic flared hem',
  ball_gown: 'princess ball gown wedding dress with voluminous tulle skirt and beaded bodice',
  mini: 'modern short mini wedding dress above the knees, chic and contemporary',
};

const TUXEDO_DESC: Record<TuxedoType, string> = {
  classic_black: 'classic black tuxedo with satin lapels and white dress shirt, black bow tie',
  navy: 'navy blue suit with slim fit, matching vest and tie',
  white: 'white dinner jacket tuxedo, elegant and summery',
  slim_fit: 'modern slim-fit charcoal grey suit with skinny tie',
};

const MAKEUP_DESC: Record<MakeupType, string> = {
  natural: 'natural makeup with dewy skin, soft pink lips, minimal eye makeup',
  glam: 'glamorous makeup with smoky eyes, bold red lips, defined contours',
  vintage: 'vintage-inspired makeup with matte skin, berry lips, winged eyeliner',
  hanbok: 'traditional Korean bridal makeup, red lips, clean skin, subtle elegance',
};

export function buildStylingPrompt(
  gender: 'her' | 'him',
  dress?: DressType,
  tuxedo?: TuxedoType,
  makeup?: MakeupType
): string {
  if (gender === 'her') {
    return `
Create a bridal portrait photo of the woman from the reference image.
She is wearing: ${DRESS_DESC[dress || 'a_line']}.
Makeup: ${MAKEUP_DESC[makeup || 'natural']}.
Full body shot, studio lighting with soft bokeh background.
${STYLE_PREFIX}
`.trim();
  }
  return `
Create a groom portrait photo of the man from the reference image.
He is wearing: ${TUXEDO_DESC[tuxedo || 'classic_black']}.
Full body shot, studio lighting with soft bokeh background.
${STYLE_PREFIX}
`.trim();
}

export function buildVenuePrompt(venueStyle: string): string {
  return `
Create a wedding ceremony scene of the couple from the reference images.
Venue style: ${venueStyle}.
The bride is in a white wedding dress and the groom is in a black tuxedo.
They are standing at the altar, facing each other, exchanging vows.
Guests are seated, flower petals in the air, warm natural light.
Composition: Wide shot showing the venue atmosphere, 16:9 aspect ratio.
${STYLE_PREFIX}
`.trim();
}

export function buildHoneymoonPrompt(destination: string, scene: string): string {
  return `
Create a honeymoon travel snapshot of the couple from the reference images.
Location: ${destination} — ${scene}.
The couple is casually dressed, relaxed and happy, enjoying their honeymoon.
Natural travel photography style, candid moments.
Composition: 4:3 aspect ratio.
${STYLE_PREFIX}
`.trim();
}
