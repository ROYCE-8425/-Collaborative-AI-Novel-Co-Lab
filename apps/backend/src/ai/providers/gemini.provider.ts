import { AiGenerateInput, AiProvider } from '../ai.interface';

export class GeminiProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  private async callGemini(input: AiGenerateInput, responseFormatJson: boolean): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is missing.');
    }

    const body: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: input.userPrompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: input.systemPrompt }],
      },
      generationConfig: {
        temperature: input.temperature ?? 0.7,
      },
    };

    if (responseFormatJson) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    const modelName = this.model || 'gemini-2.5-flash-lite';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Try fallback to gemini-1.5-flash if 404 or 400
      if ((response.status === 404 || response.status === 400) && modelName !== 'gemini-1.5-flash') {
        console.warn(`Gemini model ${modelName} failed, trying fallback model gemini-1.5-flash...`);
        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
        const fallbackBody = { ...body };
        const responseFallback = await fetch(fallbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fallbackBody),
        });

        if (!responseFallback.ok) {
          const fbErrorText = await responseFallback.text();
          throw new Error(`Gemini API Error (Fallback): ${responseFallback.status} - ${fbErrorText}`);
        }
        const resultFb = await responseFallback.json();
        return resultFb.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async generateText(input: AiGenerateInput): Promise<string> {
    return this.callGemini(input, false);
  }

  async generateJson<T>(input: AiGenerateInput): Promise<T> {
    const text = await this.callGemini(input, true);
    try {
      const match = text.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : text;
      return JSON.parse(jsonStr) as T;
    } catch (err: any) {
      throw new Error(`Failed to parse JSON response from Gemini: ${err.message}. Original text: ${text}`);
    }
  }
}
