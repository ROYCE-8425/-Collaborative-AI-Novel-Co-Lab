import { AiGenerateInput, AiProvider } from '../ai.interface';

export class OllamaProvider implements AiProvider {
  constructor(
    private readonly model: string,
    private readonly baseUrl: string = 'http://localhost:11434',
  ) {}

  private async callOllama(input: AiGenerateInput, responseFormatJson: boolean): Promise<string> {
    const modelName = this.model || 'llama3';
    const body: any = {
      model: modelName,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userPrompt },
      ],
      options: {
        temperature: input.temperature ?? 0.7,
      },
      stream: false,
    };

    if (responseFormatJson) {
      body.format = 'json';
    }

    const cleanBaseUrl = (this.baseUrl || '').replace(/\/$/, '');
    const url = `${cleanBaseUrl}/api/chat`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.message?.content || '';
  }

  async generateText(input: AiGenerateInput): Promise<string> {
    return this.callOllama(input, false);
  }

  async generateJson<T>(input: AiGenerateInput): Promise<T> {
    const text = await this.callOllama(input, true);
    try {
      const match = text.match(/\{[\s\S]*\}/);
      const jsonStr = match ? match[0] : text;
      return JSON.parse(jsonStr) as T;
    } catch (err: any) {
      throw new Error(`Failed to parse JSON response from Ollama: ${err.message}. Original text: ${text}`);
    }
  }
}
