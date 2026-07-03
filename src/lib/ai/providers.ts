// =============================================================================
// AI Provider Factory
//
// Adapter pattern: each provider implements the same interface.
// Switching providers in Settings requires zero code changes here.
//
// Currently supported: OpenAI (gpt-4o-mini default)
// Ready to add: Gemini, Claude (same interface)
// =============================================================================

import OpenAI from "openai";
import type { AIProvider } from "@/types";

// ---------------------------------------------------------------------------
// Core interface — every provider adapter implements this
// ---------------------------------------------------------------------------

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface AIProviderAdapter {
  provider: AIProvider;
  model: string;
  complete(
    system: string,
    user: string,
    options?: CompletionOptions
  ): Promise<{ text: string; promptTokens: number; completionTokens: number; totalTokens: number }>;
}

// ---------------------------------------------------------------------------
// OpenAI Adapter
// ---------------------------------------------------------------------------

class OpenAIAdapter implements AIProviderAdapter {
  provider: AIProvider = "openai";
  model: string;
  private client: OpenAI;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.model = model;
    this.client = new OpenAI({ apiKey });
  }

  async complete(system: string, user: string, options: CompletionOptions = {}) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2000,
      response_format: options.jsonMode ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const choice = response.choices[0];
    if (!choice.message.content) throw new Error("OpenAI returned empty content");

    return {
      text: choice.message.content,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Gemini Adapter (placeholder — ready to implement when needed)
// ---------------------------------------------------------------------------

class GeminiAdapter implements AIProviderAdapter {
  provider: AIProvider = "gemini";
  model: string;
  private client: OpenAI;

  constructor(apiKey: string, model = "gemini-3.1-flash-lite") {
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
  }

  async complete(system: string, user: string, options: CompletionOptions = {}) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2000,
      response_format: options.jsonMode ? { type: "json_object" } : undefined,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const choice = response.choices[0];
    if (!choice.message.content) throw new Error("Gemini returned empty content");

    return {
      text: choice.message.content,
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Claude Adapter (placeholder — ready to implement when needed)
// ---------------------------------------------------------------------------

class ClaudeAdapter implements AIProviderAdapter {
  provider: AIProvider = "claude";
  model: string;

  constructor(_apiKey: string, model = "claude-3-5-haiku-20241022") {
    this.model = model;
  }

  async complete(_system: string, _user: string, _options?: CompletionOptions): Promise<{ text: string; promptTokens: number; completionTokens: number; totalTokens: number }> {
    throw new Error("Claude adapter not yet implemented. Set AI provider to OpenAI in Settings.");
  }
}

// ---------------------------------------------------------------------------
// Factory function — creates the right adapter based on settings
// ---------------------------------------------------------------------------

export interface ProviderConfig {
  provider: AIProvider;
  model: string;
  openaiKey?: string | null;
  geminiKey?: string | null;
  claudeKey?: string | null;
}

export function createAIProvider(config: ProviderConfig): AIProviderAdapter {
  switch (config.provider) {
    case "openai": {
      const key = config.openaiKey ?? process.env.OPENAI_API_KEY;
      if (!key) throw new Error("OpenAI API key not configured. Add it in Settings.");
      return new OpenAIAdapter(key, config.model);
    }
    case "gemini": {
      const key = config.geminiKey ?? process.env.GEMINI_API_KEY;
      if (!key) throw new Error("Gemini API key not configured. Add it in Settings.");
      return new GeminiAdapter(key, config.model);
    }
    case "claude": {
      const key = config.claudeKey ?? process.env.CLAUDE_API_KEY;
      if (!key) throw new Error("Claude API key not configured. Add it in Settings.");
      return new ClaudeAdapter(key, config.model);
    }
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
