import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini/client';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'her' | 'him'

    if (!file) {
      return NextResponse.json({ valid: false, reason: '파일이 필요합니다.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const expectedGender = type === 'her' ? '여성' : '남성';
    const label = type === 'her' ? '신부' : '신랑';

    // Try multiple model names for compatibility
    const MODELS = ['gemini-2.5-flash'];
    let lastError = '';

    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          console.log(`Validation: trying model=${model}, attempt=${attempt + 1}`);
          
          const response = await genAI.models.generateContent({
            model,
            contents: [{
              role: 'user',
              parts: [
                { inlineData: { data: base64, mimeType } },
                {
                  text: `이 사진을 분석해주세요.

1. 사람이 있는가?
2. 사람이 몇 명인가?
3. 얼굴이 보이는가?
4. 상반신 이상이 보이는가?
5. 성별이 ${expectedGender}인가?

중요: 2명 이상이면 personCount를 정확히 알려주세요.

JSON만 응답:
{"hasPerson": true/false, "personCount": 숫자, "faceVisible": true/false, "upperBodyVisible": true/false, "gender": "남성"/"여성"/"불명"}`
                },
              ],
            }],
          });

          const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
          console.log('Validation response:', text.substring(0, 200));
          
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            // Can't parse = let through with warning
            console.warn('Could not parse validation response, allowing upload');
            return NextResponse.json({ valid: true });
          }

          const analysis = JSON.parse(jsonMatch[0]);

          if (!analysis.hasPerson) {
            return NextResponse.json({
              valid: false,
              reason: `사람이 감지되지 않았어요. ${label} 본인 사진을 올려주세요.`,
            });
          }

          if (analysis.personCount > 1) {
            return NextResponse.json({
              valid: false,
              reason: `${analysis.personCount}명이 감지되었어요. ${label} 한 명만 나온 단독 사진을 올려주세요.`,
            });
          }

          if (!analysis.faceVisible) {
            return NextResponse.json({
              valid: false,
              reason: `얼굴이 잘 보이지 않아요. 얼굴이 선명한 사진을 올려주세요.`,
            });
          }

          if (analysis.gender && analysis.gender !== '불명' && analysis.gender !== expectedGender) {
            return NextResponse.json({
              valid: false,
              reason: `${label} 사진에 ${expectedGender} 사진을 올려주세요. (현재: ${analysis.gender})`,
            });
          }

          // All checks passed!
          return NextResponse.json({ valid: true });

        } catch (apiError) {
          const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
          lastError = errMsg;
          console.error(`Validation [${model}] attempt ${attempt + 1}:`, errMsg);
          
          if (errMsg.includes('429') || errMsg.includes('RATE') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            await new Promise(r => setTimeout(r, 3000));
            continue;
          }
          if (errMsg.includes('not found') || errMsg.includes('404') || errMsg.includes('not supported')) {
            break; // Try next model
          }
          // Other error — try next model
          break;
        }
      }
    }

    // All models failed — allow with warning (don't block the entire service)
    console.error('All validation models failed:', lastError);
    return NextResponse.json({ 
      valid: true, 
      warning: '사진 검증을 건너뛰었어요. 단독 인물 사진을 올려주세요.' 
    });

  } catch (error) {
    console.error('Face validation critical error:', error);
    // Critical error — still allow (service availability > strict validation)
    return NextResponse.json({ 
      valid: true,
      warning: '검증 서비스에 일시적 오류가 있어요. 사진이 적합한지 직접 확인해주세요.'
    });
  }
}
