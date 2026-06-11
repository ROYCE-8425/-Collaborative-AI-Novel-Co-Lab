import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { AiGenerateInput, AiProvider } from './ai.interface';
import { MockProvider } from './providers/mock.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { XaiProvider } from './providers/xai.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { RoomGateway } from '../gateway/room.gateway';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(forwardRef(() => RoomGateway))
    private readonly roomGateway: RoomGateway,
  ) {}

  private getProvider(role: 'lore-checker' | 'writer' | 'structure-manager'): { provider: AiProvider; providerName: string; modelName: string } {
    const aiMode = process.env.AI_MODE || 'mock';

    if (aiMode === 'mock') {
      return { provider: new MockProvider(), providerName: 'mock', modelName: 'mock-model' };
    }

    let providerType = 'mock';
    let modelName = 'mock-model';

    if (role === 'lore-checker') {
      providerType = process.env.AI_LORE_PROVIDER || 'gemini';
      modelName = process.env.AI_LORE_MODEL || 'gemini-2.5-flash-lite';
    } else if (role === 'writer') {
      providerType = process.env.AI_WRITER_PROVIDER || 'xai';
      modelName = process.env.AI_WRITER_MODEL || 'grok-beta';
    } else if (role === 'structure-manager') {
      providerType = process.env.AI_STRUCTURE_PROVIDER || 'gemini';
      modelName = process.env.AI_STRUCTURE_MODEL || 'gemini-2.5-flash-lite';
    }

    const provider = this.createProviderInstance(providerType, modelName);
    return { provider, providerName: providerType, modelName };
  }

  private createProviderInstance(providerType: string, modelName: string): AiProvider {
    switch (providerType) {
      case 'gemini':
        const geminiKey = process.env.GEMINI_API_KEY || '';
        return new GeminiProvider(geminiKey, modelName);
      case 'xai':
        const xaiKey = process.env.XAI_API_KEY || '';
        return new XaiProvider(xaiKey, modelName);
      case 'openrouter':
        const openrouterKey = process.env.OPENROUTER_API_KEY || '';
        const openrouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        return new OpenRouterProvider(openrouterKey, modelName, openrouterBaseUrl);
      case 'ollama':
        const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        return new OllamaProvider(modelName, ollamaBaseUrl);
      case 'mock':
      default:
        return new MockProvider();
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`AI Request timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  private hasApiKey(providerName: string): boolean {
    if (providerName === 'mock' || providerName === 'ollama') return true;
    if (providerName === 'gemini') return !!process.env.GEMINI_API_KEY;
    if (providerName === 'xai') return !!process.env.XAI_API_KEY;
    if (providerName === 'openrouter') return !!process.env.OPENROUTER_API_KEY;
    return false;
  }

  async generateText(
    role: 'writer',
    input: AiGenerateInput,
    roomId: string,
  ): Promise<string> {
    const startTime = Date.now();
    const { provider, providerName, modelName } = this.getProvider(role);
    const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000;
    const fallbackToMock = process.env.AI_FALLBACK_TO_MOCK === 'true';

    // Broadcast current stage to frontend
    this.roomGateway.server?.to(roomId).emit('ai_stage_update', {
      roomId,
      stage: 'Writing',
      provider: providerName,
      model: modelName,
      message: `Bắt đầu chấp bút sử dụng ${providerName} (${modelName}).`,
    });

    this.logger.log(`[AI Request] Role: ${role}, Provider: ${providerName}, Model: ${modelName}`);

    if (!this.hasApiKey(providerName)) {
      if (fallbackToMock && providerName !== 'mock') {
        this.logger.warn(`[AI Fallback] Key for provider ${providerName} is missing. Falling back to mock.`);
        this.roomGateway.server?.to(roomId).emit('ai_stage_update', {
          roomId,
          stage: 'Writing',
          provider: 'mock',
          model: 'mock-model',
          isFallback: true,
          message: `API Key cho ${providerName} trống. Tự động chuyển đổi sang Mock.`,
        });
        const mockProv = new MockProvider();
        return mockProv.generateText(input);
      }
      throw new Error(`API Key for provider ${providerName} is missing.`);
    }

    try {
      const text = await this.withTimeout(provider.generateText(input), timeoutMs);
      const elapsed = Date.now() - startTime;
      this.logger.log(`[AI Response] Role: ${role}, Provider: ${providerName}, Model: ${modelName}, Elapsed: ${elapsed}ms`);
      return text;
    } catch (err: any) {
      this.logger.error(`[AI Error] Provider: ${providerName}, Model: ${modelName}, Error: ${err.message}`);

      if (fallbackToMock && providerName !== 'mock') {
        this.logger.warn(`[AI Fallback] Executing mock fallback for role ${role}`);
        this.roomGateway.server?.to(roomId).emit('ai_stage_update', {
          roomId,
          stage: 'Writing',
          provider: 'mock',
          model: 'mock-model',
          isFallback: true,
          message: `Lỗi gọi ${providerName}: ${err.message || 'Timeout'}. Tự động chuyển đổi sang Mock.`,
        });
        const mockProv = new MockProvider();
        return mockProv.generateText(input);
      }
      throw err;
    }
  }

  async generateJson<T>(
    role: 'lore-checker' | 'structure-manager',
    input: AiGenerateInput,
    roomId: string,
  ): Promise<T> {
    const startTime = Date.now();
    const { provider, providerName, modelName } = this.getProvider(role);
    const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000;
    const fallbackToMock = process.env.AI_FALLBACK_TO_MOCK === 'true';

    const stage = role === 'lore-checker' ? 'Lore checking' : 'Structuring';

    // Broadcast current stage to frontend
    this.roomGateway.server?.to(roomId).emit('ai_stage_update', {
      roomId,
      stage,
      provider: providerName,
      model: modelName,
      message: `Khởi động ${role === 'lore-checker' ? 'AI Lore Checker' : 'AI Structure Manager'} sử dụng ${providerName} (${modelName}).`,
    });

    this.logger.log(`[AI Request] Role: ${role}, Provider: ${providerName}, Model: ${modelName}`);

    if (!this.hasApiKey(providerName)) {
      if (fallbackToMock && providerName !== 'mock') {
        this.logger.warn(`[AI Fallback] Key for provider ${providerName} is missing. Falling back to mock.`);
        this.roomGateway.server?.to(roomId).emit('ai_stage_update', {
          roomId,
          stage,
          provider: 'mock',
          model: 'mock-model',
          isFallback: true,
          message: `API Key cho ${providerName} trống. Tự động chuyển đổi sang Mock.`,
        });
        const mockProv = new MockProvider();
        return mockProv.generateJson<T>(input);
      }
      throw new Error(`API Key for provider ${providerName} is missing.`);
    }

    try {
      const json = await this.withTimeout(provider.generateJson<T>(input), timeoutMs);
      const elapsed = Date.now() - startTime;
      this.logger.log(`[AI Response] Role: ${role}, Provider: ${providerName}, Model: ${modelName}, Elapsed: ${elapsed}ms`);
      return json;
    } catch (err: any) {
      this.logger.error(`[AI Error] Provider: ${providerName}, Model: ${modelName}, Error: ${err.message}`);

      if (fallbackToMock && providerName !== 'mock') {
        this.logger.warn(`[AI Fallback] Executing mock fallback for role ${role}`);
        this.roomGateway.server?.to(roomId).emit('ai_stage_update', {
          roomId,
          stage,
          provider: 'mock',
          model: 'mock-model',
          isFallback: true,
          message: `Lỗi gọi ${providerName}: ${err.message || 'Timeout'}. Tự động chuyển đổi sang Mock.`,
        });
        const mockProv = new MockProvider();
        return mockProv.generateJson<T>(input);
      }
      throw err;
    }
  }
}
