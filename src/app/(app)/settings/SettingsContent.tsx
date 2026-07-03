"use client";

// =============================================================================
// Settings Page — Full Implementation (Phase 4)
//
// Sections:
//   1. AI Provider — radio cards (OpenAI / Gemini / Claude)
//   2. API Keys — masked input + test connection
//   3. Telegram Integration — bot token + chat ID + test button
//   4. HeadHunter Search Config — query, area, page size, min score
//   5. Prompt Customization (advanced) — custom prompt overrides
// =============================================================================

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Bot, Key, Send, Search, Zap, Save, Loader2, CheckCircle2,
  Eye, EyeOff, TestTube, ChevronDown, ChevronUp, AlertTriangle
} from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/useQueries";
import { LoadingSpinner } from "@/components/shared/Skeletons";
import type { AIProvider } from "@/types";

// ---------------------------------------------------------------------------
// Shared field components (local to this page)
// ---------------------------------------------------------------------------

function SectionCard({ title, icon: Icon, children, hint }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: "hsl(263 70% 58% / 0.1)" }}>
          <Icon className="h-3.5 w-3.5" style={{ color: "hsl(263 70% 58%)" }} />
        </div>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 98%)" }}>{title}</h2>
          {hint && <p className="text-xs" style={{ color: "hsl(240 4% 38%)" }}>{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(240 4% 65%)" }}>{children}</label>;
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        {...props}
        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(263_70%_58%)] placeholder:text-[hsl(240_4%_38%)]"
        style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(0 0% 98%)" }}
      />
      {error && <p className="mt-1 text-xs" style={{ color: "hsl(0 72% 61%)" }}>{error}</p>}
    </div>
  );
}

// Masked API key input
function KeyInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isMasked = value === "••••••••";

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={isMasked && !visible ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isMasked ? "••••••••  (saved)" : placeholder}
        className="w-full rounded-md border bg-transparent px-3 py-2 pr-10 text-sm outline-none transition-colors focus:border-[hsl(263_70%_58%)] placeholder:text-[hsl(240_4%_38%)]"
        style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(0 0% 98%)" }}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-60"
        style={{ color: "hsl(240 4% 38%)" }}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// AI Provider card
const AI_PROVIDERS: { value: AIProvider; label: string; desc: string; models: string[] }[] = [
  { value: "openai", label: "OpenAI", desc: "GPT-4o-mini (recommended)", models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"] },
  { value: "gemini", label: "Google Gemini", desc: "Gemini 3.1 Flash Lite", models: ["gemini-3.1-flash-lite", "gemini-2.0-flash", "gemini-1.5-pro"] },
  { value: "claude", label: "Anthropic Claude", desc: "Claude 3.5 Haiku", models: ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"] },
];

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------
interface SettingsForm {
  aiProvider: AIProvider;
  aiModel: string;
  openaiKey: string;
  geminiKey: string;
  claudeKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  hhSearchText: string;
  hhArea: string;
  hhPerPage: number;
  notifyMinScore: number;
  promptAnalysis: string;
  promptCoverLetter: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SettingsContent() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, watch, setValue, handleSubmit, reset } = useForm<SettingsForm>({
    defaultValues: {
      aiProvider: "openai",
      aiModel: "gpt-4o-mini",
      openaiKey: "",
      geminiKey: "",
      claudeKey: "",
      telegramBotToken: "",
      telegramChatId: "",
      hhSearchText: "AI engineer automation",
      hhArea: "160",
      hhPerPage: 20,
      notifyMinScore: 70,
      promptAnalysis: "",
      promptCoverLetter: "",
    },
  });

  const selectedProvider = watch("aiProvider");
  const currentModel = watch("aiModel");

  useEffect(() => {
    if (settings) {
      reset({
        aiProvider: settings.aiProvider,
        aiModel: settings.aiModel,
        openaiKey: settings.openaiKey ?? "",
        geminiKey: settings.geminiKey ?? "",
        claudeKey: settings.claudeKey ?? "",
        telegramBotToken: settings.telegramBotToken ?? "",
        telegramChatId: settings.telegramChatId ?? "",
        hhSearchText: settings.hhSearchText,
        hhArea: settings.hhArea,
        hhPerPage: settings.hhPerPage,
        notifyMinScore: settings.notifyMinScore,
        promptAnalysis: settings.promptAnalysis ?? "",
        promptCoverLetter: settings.promptCoverLetter ?? "",
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: SettingsForm) => {
    // Don't send masked placeholder back
    const cleaned = {
      ...data,
      openaiKey: data.openaiKey === "••••••••" ? undefined : data.openaiKey || null,
      geminiKey: data.geminiKey === "••••••••" ? undefined : data.geminiKey || null,
      claudeKey: data.claudeKey === "••••••••" ? undefined : data.claudeKey || null,
      telegramBotToken: data.telegramBotToken === "••••••••" ? undefined : data.telegramBotToken || null,
      promptAnalysis: data.promptAnalysis || null,
      promptCoverLetter: data.promptCoverLetter || null,
    };
    await updateSettings.mutateAsync(cleaned as Parameters<typeof updateSettings.mutateAsync>[0]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const testTelegram = async () => {
    const token = watch("telegramBotToken");
    const chatId = watch("telegramChatId");
    if (!token || !chatId || token === "••••••••") {
      setTelegramTestResult({ ok: false, msg: "Enter bot token and chat ID first" });
      return;
    }
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const res = await fetch("/api/settings/test-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramBotToken: token, telegramChatId: chatId }),
      });
      const data = await res.json();
      setTelegramTestResult({ ok: data.ok, msg: data.ok ? "Message sent successfully!" : data.error ?? "Failed" });
    } catch {
      setTelegramTestResult({ ok: false, msg: "Network error" });
    } finally {
      setTestingTelegram(false);
    }
  };

  if (isLoading) return <LoadingSpinner size={32} />;

  const providerInfo = AI_PROVIDERS.find((p) => p.value === selectedProvider);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "hsl(0 0% 98%)" }}>Settings</h1>
          <p className="mt-1 text-sm" style={{ color: "hsl(240 4% 65%)" }}>
            AI provider, API keys, Telegram, and search configuration.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={updateSettings.isPending}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "hsl(263 70% 58%)", color: "white" }}
        >
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveSuccess ? "Saved!" : "Save Settings"}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 1. AI Provider */}
        <SectionCard title="AI Provider" icon={Bot} hint="Select your LLM provider and model">
          <div className="grid grid-cols-3 gap-3">
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setValue("aiProvider", p.value);
                  setValue("aiModel", p.models[0]);
                }}
                className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all"
                style={{
                  borderColor: selectedProvider === p.value ? "hsl(263 70% 58% / 0.6)" : "hsl(240 5% 18%)",
                  backgroundColor: selectedProvider === p.value ? "hsl(263 70% 58% / 0.08)" : "hsl(240 10% 4%)",
                }}
              >
                <span className="text-sm font-semibold" style={{ color: "hsl(0 0% 98%)" }}>{p.label}</span>
                <span className="text-xs" style={{ color: "hsl(240 4% 38%)" }}>{p.desc}</span>
                {selectedProvider === p.value && (
                  <CheckCircle2 className="h-3.5 w-3.5 mt-1" style={{ color: "hsl(263 70% 68%)" }} />
                )}
              </button>
            ))}
          </div>

          {/* Model selector for selected provider */}
          {providerInfo && (
            <div>
              <Label>Model</Label>
              <select
                value={currentModel}
                onChange={(e) => setValue("aiModel", e.target.value)}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(0 0% 98%)", backgroundColor: "hsl(240 10% 4%)" }}
              >
                {providerInfo.models.map((m) => (
                  <option key={m} value={m} style={{ backgroundColor: "hsl(240 6% 7%)" }}>{m}</option>
                ))}
              </select>
              {selectedProvider === "claude" && (
                <div className="mt-2 flex items-start gap-2 rounded-md border p-2.5" style={{ borderColor: "hsl(38 92% 50% / 0.3)", backgroundColor: "hsl(38 92% 50% / 0.08)" }}>
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "hsl(38 92% 60%)" }} />
                  <p className="text-xs" style={{ color: "hsl(38 92% 60%)" }}>
                    Claude adapter is available but not yet implemented. Will be added in v2. Use OpenAI for now.
                  </p>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* 2. API Keys */}
        <SectionCard title="API Keys" icon={Key} hint="Keys are stored encrypted and never returned in cleartext">
          <div className="space-y-4">
            <div>
              <Label>OpenAI API Key</Label>
              <KeyInput
                value={watch("openaiKey")}
                onChange={(v) => setValue("openaiKey", v)}
                placeholder="sk-proj-..."
              />
              <p className="mt-1 text-xs" style={{ color: "hsl(240 4% 38%)" }}>
                Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline hover:opacity-70">platform.openai.com/api-keys</a>
              </p>
            </div>
            <div>
              <Label>Gemini API Key</Label>
              <KeyInput
                value={watch("geminiKey")}
                onChange={(v) => setValue("geminiKey", v)}
                placeholder="AIza..."
              />
            </div>
            <div>
              <Label>Anthropic (Claude) API Key</Label>
              <KeyInput
                value={watch("claudeKey")}
                onChange={(v) => setValue("claudeKey", v)}
                placeholder="sk-ant-..."
              />
            </div>
          </div>
        </SectionCard>

        {/* 3. Telegram */}
        <SectionCard title="Telegram Notifications" icon={Send} hint="Get notified when a high-score vacancy is found">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bot Token</Label>
                <KeyInput
                  value={watch("telegramBotToken")}
                  onChange={(v) => setValue("telegramBotToken", v)}
                  placeholder="123456789:AAF..."
                />
                <p className="mt-1 text-xs" style={{ color: "hsl(240 4% 38%)" }}>
                  Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline hover:opacity-70">@BotFather</a>
                </p>
              </div>
              <div>
                <Label>Chat ID</Label>
                <Input
                  {...register("telegramChatId")}
                  placeholder="-1001234567890"
                />
                <p className="mt-1 text-xs" style={{ color: "hsl(240 4% 38%)" }}>
                  Your personal chat ID or group/channel ID
                </p>
              </div>
            </div>

            <div>
              <Label>Minimum Score to Notify</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  {...register("notifyMinScore", { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="w-8 text-sm font-semibold text-right" style={{ color: "hsl(263 70% 68%)" }}>
                  {watch("notifyMinScore")}
                </span>
              </div>
              <p className="mt-1 text-xs" style={{ color: "hsl(240 4% 38%)" }}>
                Only vacancies with score ≥ {watch("notifyMinScore")} will trigger a Telegram message.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={testTelegram}
                disabled={testingTelegram}
                className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors hover:bg-[hsl(240_4%_14%)] disabled:opacity-50"
                style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(240 4% 65%)" }}
              >
                {testingTelegram ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4" />
                )}
                Test Connection
              </button>
              {telegramTestResult && (
                <span
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: telegramTestResult.ok ? "hsl(142 71% 55%)" : "hsl(0 72% 61%)" }}
                >
                  {telegramTestResult.ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {telegramTestResult.msg}
                </span>
              )}
            </div>
          </div>
        </SectionCard>

        {/* 4. HeadHunter Search */}
        <SectionCard title="HeadHunter Search Config" icon={Search} hint="Parameters used by the n8n workflow to fetch vacancies">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Search Query</Label>
              <Input
                {...register("hhSearchText")}
                placeholder="AI engineer automation"
              />
              <p className="mt-1 text-xs" style={{ color: "hsl(240 4% 38%)" }}>
                Keywords sent to hh.ru API. Supports OR: "Python OR Go developer"
              </p>
            </div>
            <div>
              <Label>Area Code (City)</Label>
              <Input
                {...register("hhArea")}
                placeholder="160"
              />
              <p className="mt-1 text-xs" style={{ color: "hsl(240 4% 38%)" }}>
                160 = Almaty · 4 = Novosibirsk · 1 = Moscow
              </p>
            </div>
            <div>
              <Label>Results per Page</Label>
              <Input
                {...register("hhPerPage", { valueAsNumber: true })}
                type="number"
                min={5}
                max={100}
                placeholder="20"
              />
            </div>
          </div>
        </SectionCard>

        {/* 5. Advanced — Prompt Customization */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "hsl(240 5% 18%)" }}
        >
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between p-5 transition-colors hover:bg-[hsl(240_4%_14%)]"
            style={{ backgroundColor: "hsl(240 6% 7%)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: "hsl(263 70% 58% / 0.1)" }}>
                <Zap className="h-3.5 w-3.5" style={{ color: "hsl(263 70% 58%)" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "hsl(0 0% 98%)" }}>Prompt Customization</p>
                <p className="text-xs" style={{ color: "hsl(240 4% 38%)" }}>Advanced — override default AI prompts</p>
              </div>
            </div>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" style={{ color: "hsl(240 4% 38%)" }} />
            ) : (
              <ChevronDown className="h-4 w-4" style={{ color: "hsl(240 4% 38%)" }} />
            )}
          </button>

          {showAdvanced && (
            <div className="border-t p-5 space-y-4 animate-fade-in" style={{ borderColor: "hsl(240 5% 18%)", backgroundColor: "hsl(240 6% 7%)" }}>
              <div
                className="flex items-start gap-2 rounded-md border p-3"
                style={{ borderColor: "hsl(217 91% 60% / 0.3)", backgroundColor: "hsl(217 91% 60% / 0.06)" }}
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "hsl(217 91% 70%)" }} />
                <p className="text-xs" style={{ color: "hsl(217 91% 70%)" }}>
                  Leave blank to use the default system prompts. Custom prompts override the built-in templates entirely.
                  The AI must return valid JSON matching the expected schema or analysis will fail silently.
                </p>
              </div>
              <div>
                <Label>Analysis Prompt Override (Prompt A)</Label>
                <textarea
                  {...register("promptAnalysis")}
                  rows={6}
                  placeholder="Leave blank to use the default system prompt..."
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(263_70%_58%)] placeholder:text-[hsl(240_4%_38%)] resize-y font-mono"
                  style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(0 0% 98%)" }}
                />
              </div>
              <div>
                <Label>Cover Letter Prompt Override (Prompt B)</Label>
                <textarea
                  {...register("promptCoverLetter")}
                  rows={4}
                  placeholder="Leave blank to use the default cover letter prompt..."
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(263_70%_58%)] placeholder:text-[hsl(240_4%_38%)] resize-y font-mono"
                  style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(0 0% 98%)" }}
                />
              </div>
            </div>
          )}
        </div>

        {updateSettings.error && (
          <p className="text-sm" style={{ color: "hsl(0 72% 61%)" }}>
            Error: {updateSettings.error.message}
          </p>
        )}
      </form>
    </div>
  );
}
