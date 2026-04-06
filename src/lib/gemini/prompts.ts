/**
 * MerryMe 프롬프트 템플릿
 * Ultra-realistic photographic style with NanoBanana2 warm tones
 */

const STYLE_PREFIX = `
CRITICAL COMPOSITION: The female bride MUST ALWAYS be positioned on the LEFT side of the image, and the male groom MUST ALWAYS be positioned on the RIGHT side of the image. This is technically mandatory for face-swap tracking.
CRITICAL IDENTITY MATCHING: You MUST structure the generated face shapes, jawlines, and facial spacing EXACTLY like the reference photos. Do NOT generate generic attractive faces. YOU MUST CLONE the identity of the references.
CRITICAL EXPRESSION MATCHING: The generated faces MUST have a completely NEUTRAL expression or a very subtle, closed-mouth smile. ABSOLUTELY NO open mouths, NO visible teeth, and NO big smiles or laughing. Extreme expressions will severely break the subsequent face-mapping algorithm.
CRITICAL DESIGN: Generate an ultra-realistic photograph that looks like it was taken with a professional DSLR camera (Canon EOS R5 or Sony A7R IV).
Maintain the EXACT facial features, skin tone, hair, body proportions and unique characteristics from the reference images.
Photo style: 35mm f/1.4 lens, shallow depth of field, natural golden hour lighting, 
warm film color grading, genuine skin textures with pores visible, natural hair strands,
realistic fabric wrinkles on clothing, ambient light reflections in eyes.
Do NOT make it look like AI art, CGI, or illustration. It must look like a real photograph taken by a professional wedding photographer.
`.trim();

export type SnapshotTheme =
  | 'cherry_blossom'
  | 'beach_sunset'
  | 'classic_studio'
  | 'forest_garden'
  | 'autumn_park'
  | 'snowy_winter'
  | 'hanok_traditional';

const SNAPSHOT_THEMES: Record<SnapshotTheme, string> = {
  cherry_blossom: '만개한 벚꽃 나무 아래에서, 핑크빛 꽃잎이 부드럽게 흩날리는 봄날 오후, 자연광 역광, 배경 보케',
  beach_sunset: '해변에서 석양이 지는 골든아워, 발밑에 부드러운 모래와 잔잔한 파도, 따뜻한 오렌지빛 역광',
  classic_studio: '고급 웨딩 사진 스튜디오, Rembrandt 조명, 크리미한 아이보리 배경, 부드러운 그림자',
  forest_garden: '울창한 초록 숲 속 가든 웨딩, 나뭇잎 사이로 스며드는 자연 채광, 야생화와 덩굴 장식',
  autumn_park: '단풍이 만개한 가을 공원 산책로, 붉고 노란 낙엽이 흩날리는 따뜻한 오후, 역광 실루엣',
  snowy_winter: '하얀 눈이 소복이 쌓인 겨울 풍경, 따뜻한 울 코트와 머플러, 입김이 보이는 로맨틱한 분위기',
  hanok_traditional: '전통 한옥 대청마루와 기와지붕, 한복을 입고 단아한 자세, 고즈넉한 한국 전통 분위기',
};

export function buildSnapshotPrompt(theme: SnapshotTheme, angleIndex: number = 0): string {
  const angles = [
    'Full body shot from front, the couple facing camera with a subtle closed-mouth smile, one person\'s arm around the other\'s waist, relaxed and genuine pose',
    'Medium shot of one person giving the other a piggyback ride, both showing gentle expressions, candid and soft moment',
    'Close-up of the couple touching foreheads gently, eyes closed, tender romantic moment, shallow depth of field bokeh',
    'Wide shot of the couple twirling/dancing together, dress flowing in the breeze, graceful movement captured mid-spin, calm facial expressions',
  ];
  const angle = angles[angleIndex % angles.length];

  return `
Create an ultra-realistic pre-wedding couple photograph.
Scene: ${SNAPSHOT_THEMES[theme]}
Camera angle: ${angle}.
Lighting: Natural light with subtle fill, realistic shadows, skin catch lights in eyes.
ABSOLUTE REQUIREMENT: The two people in this photo must be IDENTICAL to the reference photos provided. Copy their exact face shape, eyes, nose, mouth, skin color, hairstyle, body build. Do NOT substitute with different-looking people.
${STYLE_PREFIX}
Generate one stunning, photorealistic image indistinguishable from a real professional wedding photograph.
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

export function buildVenuePrompt(venueStyle: string, angleIndex: number = 0): string {
  const angles = [
    'Wide cinematic shot of the couple walking down the aisle together, guests standing on both sides watching, flower petals in the air, bridal entrance moment, calm expressions',
    'Medium shot of the couple standing before the officiant at the altar exchanging wedding vows, hands held together, emotional and heartfelt moment, serene faces',
    'The couple performing a traditional bow ceremony (맞절) facing each other at the altar, respectful and solemn, guests watching in the background',
    'Joyful exit scene — the couple walking back up the aisle together after the ceremony, graceful posture, guests clapping and waving, confetti or petals flying, soft closed-mouth smiles',
  ];
  const angle = angles[angleIndex % angles.length];

  return `
Create an ultra-realistic wedding ceremony photograph.
Venue: ${venueStyle}.
Scene: ${angle}.
The couple is standing naturally before the officiant/minister. They look genuinely emotional and happy.
Details: Flower arrangements, guest seating, warm ambient lighting, realistic fabric textures on the wedding dress.
${STYLE_PREFIX}
Generate one stunning, photorealistic wedding ceremony photograph.
`.trim();
}

export function buildHoneymoonPrompt(destination: string, scene: string, angleIndex: number = 0): string {
  const angles = [
    'Wide shot of the couple in matching casual summer outfits (linen shirts, sundress), posing at a famous landmark, relaxed pose with the scenic background, subtle closed-mouth smile',
    'Medium shot of the couple in smart-casual evening wear, enjoying a romantic candlelit dinner at an outdoor restaurant, warm ambient lighting, holding wine glasses, serene faces',
    'Candid lifestyle shot of the couple in sporty/adventure outfits (light jackets, sneakers), walking hand-in-hand on a scenic trail or beach, wind in their hair, calm and composed',
    'Close-up romantic portrait of the couple in elegant resort wear, sitting together at a scenic viewpoint during golden hour sunset, heads leaning toward each other',
  ];
  const angle = angles[angleIndex % angles.length];

  return `
Create an ultra-realistic honeymoon travel photograph.
Location: ${destination} — ${scene}.
Camera angle: ${angle}.
The couple is casually dressed, relaxed and naturally happy, genuine candid moment.
Natural travel photography, golden hour lighting, DSLR quality.
${STYLE_PREFIX}
Generate one photorealistic honeymoon snapshot.
`.trim();
}
