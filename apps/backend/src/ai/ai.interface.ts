export interface AiGenerateInput {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
}

export interface AiProvider {
  generateText(input: AiGenerateInput): Promise<string>;
  generateJson<T>(input: AiGenerateInput): Promise<T>;
}
