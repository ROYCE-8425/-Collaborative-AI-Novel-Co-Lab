import { AiGenerateInput, AiProvider } from '../ai.interface';

export class OpenRouterProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string = 'https://openrouter.ai/api/v1',
  ) {}

  private async callOpenRouter(input: AiGenerateInput, responseFormatJson: boolean): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is missing.');
    }

    const modelName = this.model || 'google/gemini-2.5-flash';
    const body: any = {
      model: modelName,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userPrompt },
      ],
      temperature: input.temperature ?? 0.7,
    };

    if (responseFormatJson) {
      body.response_format = { type: 'json_object' };
    }

    const cleanBaseUrl = (this.baseUrl || '').replace(/\/$/, '');
    const url = `${cleanBaseUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://github.com/google/collaborative-novel', // Required for OpenRouter
        'X-Title': 'AI Novel Co-Lab',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || '';
  }

  async generateText(input: AiGenerateInput): Promise<string> {
    return this.callOpenRouter(input, false);
  }

  async generateJson<T>(input: AiGenerateInput): Promise<T> {
    const text = await this.callOpenRouter(input, true);
    try {
      const match = text.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : text;
      return JSON.parse(jsonStr) as T;
    } catch (err: any) {
      throw new Error(`Failed to parse JSON response from OpenRouter: ${err.message}. Original text: ${text}`);
    }
  }
}
