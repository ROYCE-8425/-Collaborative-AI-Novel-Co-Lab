import { AiGenerateInput, AiProvider } from '../ai.interface';

export class MockProvider implements AiProvider {
  async generateText(input: AiGenerateInput): Promise<string> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const promptLower = (input.userPrompt || '').toLowerCase();
    
    if (promptLower.includes('ý tưởng mới') || promptLower.includes('tác giả')) {
      // Find the idea inside prompt if possible
      const match = input.userPrompt.match(/"""([\s\S]*?)"""|=== Ý TƯỞNG MỚI ĐỒNG TÁC GIẢ ===\n"([\s\S]*?)"|=== Ý TƯỞNG MỚI ===\n"([\s\S]*?)"/);
      const ideaContent = match ? (match[1] || match[2] || match[3] || '').trim() : '';
      
      return `\nĐúng lúc đó, ý tưởng mới đã tạo ra biến chuyển bất ngờ: "${ideaContent || 'sự kiện bí ẩn'}". Luồng năng lượng xung quanh đột ngột dao động mạnh mẽ, mở ra một hướng đi không ai ngờ tới trong hành trình khám phá...`;
    }

    return '\nKhông gian im lặng kéo dài, đánh dấu một bước chuyển mình của các nhân vật trước những thử thách phía trước...';
  }

  async generateJson<T>(input: AiGenerateInput): Promise<T> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const promptLower = (input.userPrompt || '').toLowerCase();

    // Check if it's a Lore Check request
    if (promptLower.includes('lorebook') || promptLower.includes('kiểm duyệt') || promptLower.includes('moderation')) {
      let approved = true;
      let reason = 'Ý tưởng phù hợp với bối cảnh cốt truyện (Mock).';
      const violations: string[] = [];

      // Simple mock rule: if idea contains "break" or "phá hủy"
      if (promptLower.includes('break') || promptLower.includes('phá hủy bối cảnh')) {
        approved = false;
        reason = 'Mâu thuẫn với quy tắc thiết lập bối cảnh có sẵn trong Lorebook (Mock).';
        violations.push('Lorebook violation: rule conflict');
      }

      const result = {
        result: approved ? 'approved' : 'rejected',
        reason,
        violations,
        confidence: approved ? 0.95 : 0.88,
      };

      return result as unknown as T;
    }

    // Otherwise, assume it's a Structure Manager request
    const result = {
      action: Math.random() < 0.3 ? 'new_chapter' : 'append',
      chapterTitle: 'Chương Tiếp Theo: Chân Tướng Dần Hé Lộ',
      reason: 'Tiến trình câu chuyện diễn biến tự nhiên, tiếp tục mạch văn chương trước (Mock).',
    };

    return result as unknown as T;
  }
}
