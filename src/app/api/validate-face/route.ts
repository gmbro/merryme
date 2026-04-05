import { NextRequest, NextResponse } from 'next/server';
import { genAI } from '@/lib/gemini/client';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'her' | 'him'

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const expectedGender = type === 'her' ? '여성' : '남성';
    const label = type === 'her' ? '신부' : '신랑';

    // Use Gemini to analyze the face + gender + body (fast model)
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: { data: base64, mimeType },
          },
          {
            text: `이 사진을 분석해주세요. 다음 기준으로 판단해주세요:

1. 사진에 사람이 있는가?
2. 사람이 몇 명인가?
3. 얼굴이 명확하게 보이는가?
4. 상반신 이상이 보이는가? (옷 스타일링에 필요)
5. 성별이 ${expectedGender}인가? (외형 기준으로 판단)

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
  "hasPerson": true/false,
  "personCount": 숫자,
  "faceVisible": true/false,
  "upperBodyVisible": true/false,
  "gender": "남성" 또는 "여성" 또는 "불명",
  "reason": "한국어로 간결한 설명"
}`
          },
        ],
      }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
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
        reason: `${analysis.personCount}명이 감지되었어요. ${label} 한 명만 나온 사진을 올려주세요.`,
      });
    }

    if (!analysis.faceVisible) {
      return NextResponse.json({
        valid: false,
        reason: `얼굴이 잘 보이지 않아요. 얼굴이 선명한 사진을 올려주세요.`,
      });
    }

    if (!analysis.upperBodyVisible) {
      return NextResponse.json({
        valid: false,
        reason: `상반신이 잘 보이지 않아요. 스타일링을 위해 상반신이 보이는 사진이 필요해요.`,
      });
    }

    // Gender check
    if (analysis.gender && analysis.gender !== '불명' && analysis.gender !== expectedGender) {
      return NextResponse.json({
        valid: false,
        reason: `${label} 사진에 ${expectedGender} 사진을 올려주세요. 현재 ${analysis.gender}으로 인식되었어요.`,
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Face validation error:', error);
    // On error, allow the upload (don't block the user)
    return NextResponse.json({ valid: true });
  }
}
