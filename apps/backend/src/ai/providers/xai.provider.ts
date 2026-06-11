import { AiGenerateInput, AiProvider } from '../ai.interface';

export class XaiProvider implements AiProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  private async callXai(input: AiGenerateInput, responseFormatJson: boolean): Promise<string> {
    if (!this.apiKey) {
      throw new Error('XAI_API_KEY is missing.');
    }

    const modelName = this.model || 'grok-beta';
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

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || '';
  }

  async generateText(input: AiGenerateInput): Promise<string> {
    return this.callXai(input, false);
  }

  async generateJson<T>(input: AiGenerateInput): Promise<T> {
    const text = await this.callXai(input, true);
    try {
      const match = text.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : text;
      return JSON.parse(jsonStr) as T;
    } catch (err: any) {
      throw new Error(`Failed to parse JSON response from xAI: ${err.message}. Original text: ${text}`);
    }
  }
}
