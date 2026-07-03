"use client";

// =============================================================================
// Profile Page — Full Implementation (Phase 4)
//
// Sections:
//   1. Basic info (name, summary)
//   2. Skills editor (multi-tag)
//   3. Technologies editor (multi-tag)
//   4. Experience timeline (add/remove entries)
//   5. Salary range + currency
//   6. Preferences (work formats, languages, cities)
//
// State: React Hook Form + Zod validation
// Mutations: useUpdateProfile (TanStack Query)
// =============================================================================

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { User, Plus, X, Save, Loader2, CheckCircle2, Briefcase, MapPin, Globe, DollarSign, Trash2 } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useQueries";
import { LoadingSpinner } from "@/components/shared/Skeletons";

// ---------------------------------------------------------------------------
// Zod schema (mirrors API validation)
// ---------------------------------------------------------------------------
const schema = z.object({
  name: z.string().max(100).optional(),
  summary: z.string().max(1000).optional(),
  skills: z.array(z.string()),
  technologies: z.array(z.string()),
  experience: z.array(z.object({
    role: z.string().min(1, "Role is required"),
    company: z.string().min(1, "Company is required"),
    years: z.coerce.number().min(0).max(50),
    description: z.string().optional(),
  })),
  salaryMin: z.coerce.number().positive().optional().nullable(),
  salaryMax: z.coerce.number().positive().optional().nullable(),
  currency: z.enum(["KZT", "USD", "EUR", "RUB"]),
  workFormats: z.array(z.enum(["remote", "hybrid", "office"])),
  languages: z.array(z.string()),
  cities: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Tag input component — used for skills, technologies, languages, cities
// ---------------------------------------------------------------------------
function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }, [input, value, onChange]);

  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));

  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-md border p-2 min-h-[42px]"
      style={{ borderColor: "hsl(240 5% 18%)", backgroundColor: "hsl(240 10% 4%)" }}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: "hsl(263 70% 58% / 0.12)",
            color: "hsl(263 70% 75%)",
            borderColor: "hsl(263 70% 58% / 0.3)",
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            className="ml-0.5 hover:opacity-60 transition-opacity"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
          if (e.key === "Backspace" && !input && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
        style={{ color: "hsl(0 0% 98%)" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: "hsl(240 6% 7%)", borderColor: "hsl(240 5% 18%)" }}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ backgroundColor: "hsl(263 70% 58% / 0.1)" }}>
          <Icon className="h-3.5 w-3.5" style={{ color: "hsl(263 70% 58%)" }} />
        </div>
        <h2 className="text-sm font-semibold" style={{ color: "hsl(0 0% 98%)" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field components
// ---------------------------------------------------------------------------
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1" style={{ color: "hsl(240 4% 65%)" }}>{children}</label>;
}

function TextInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
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

function TextArea({ error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <div>
      <textarea
        {...props}
        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[hsl(263_70%_58%)] placeholder:text-[hsl(240_4%_38%)] resize-none"
        style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(0 0% 98%)" }}
      />
      {error && <p className="mt-1 text-xs" style={{ color: "hsl(0 72% 61%)" }}>{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ProfileContent() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    defaultValues: {
      name: "",
      summary: "",
      skills: [],
      technologies: [],
      experience: [],
      salaryMin: undefined,
      salaryMax: undefined,
      currency: "KZT",
      workFormats: [],
      languages: [],
      cities: [],
    },
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: "experience",
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? "",
        summary: profile.summary ?? "",
        skills: profile.skills,
        technologies: profile.technologies,
        experience: (profile.experience as FormValues["experience"]) ?? [],
        salaryMin: profile.salaryMin ?? undefined,
        salaryMax: profile.salaryMax ?? undefined,
        currency: (profile.currency as FormValues["currency"]) ?? "KZT",
        workFormats: (profile.workFormats as FormValues["workFormats"]) ?? [],
        languages: profile.languages,
        cities: profile.cities,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: FormValues) => {
    await updateProfile.mutateAsync(data);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    reset(data); // Clear isDirty
  };

  if (isLoading) return <LoadingSpinner size={32} />;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "hsl(0 0% 98%)" }}>Profile</h1>
          <p className="mt-1 text-sm" style={{ color: "hsl(240 4% 65%)" }}>
            Your skills and preferences used for AI vacancy scoring.
          </p>
        </div>
        <button
          type="button"
          form="profile-form"
          onClick={handleSubmit(onSubmit)}
          disabled={updateProfile.isPending || !isDirty}
          className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "hsl(263 70% 58%)", color: "white" }}
        >
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveSuccess ? "Saved!" : "Save Profile"}
        </button>
      </div>

      <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 1. Basic Info */}
        <Section title="Basic Information" icon={User}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <TextInput
                {...register("name")}
                placeholder="e.g. Alex Ivanov"
                error={errors.name?.message}
              />
            </div>
            <div>
              <FieldLabel>Professional Summary</FieldLabel>
              <TextArea
                {...register("summary")}
                rows={4}
                placeholder="A brief bio injected into the AI prompt to personalize analysis. Be specific about your strengths and goals..."
                error={errors.summary?.message}
              />
              <p className="mt-1 text-xs" style={{ color: "hsl(240 4% 38%)" }}>
                This summary is sent to the AI with every vacancy. Make it count.
              </p>
            </div>
          </div>
        </Section>

        {/* 2. Skills */}
        <Section title="Skills" icon={User}>
          <div>
            <FieldLabel>Technical Skills — press Enter or comma to add</FieldLabel>
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Python, TypeScript, SQL..."
                />
              )}
            />
          </div>
          <div>
            <FieldLabel>Technologies & Frameworks</FieldLabel>
            <Controller
              control={control}
              name="technologies"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="React, FastAPI, Supabase, n8n..."
                />
              )}
            />
          </div>
        </Section>

        {/* 3. Experience */}
        <Section title="Experience" icon={Briefcase}>
          <div className="space-y-3">
            {expFields.map((field, index) => (
              <div
                key={field.id}
                className="relative rounded-lg border p-4 space-y-3"
                style={{ borderColor: "hsl(240 5% 22%)", backgroundColor: "hsl(240 10% 4%)" }}
              >
                <button
                  type="button"
                  onClick={() => removeExp(index)}
                  className="absolute top-3 right-3 p-1 rounded transition-colors hover:opacity-60"
                  style={{ color: "hsl(0 72% 51%)" }}
                  aria-label="Remove experience entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Role / Title</FieldLabel>
                    <TextInput
                      {...register(`experience.${index}.role`)}
                      placeholder="Senior Developer"
                      error={errors.experience?.[index]?.role?.message}
                    />
                  </div>
                  <div>
                    <FieldLabel>Company</FieldLabel>
                    <TextInput
                      {...register(`experience.${index}.company`)}
                      placeholder="Acme Corp"
                      error={errors.experience?.[index]?.company?.message}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Years of Experience</FieldLabel>
                  <TextInput
                    {...register(`experience.${index}.years`)}
                    type="number"
                    min={0}
                    max={50}
                    placeholder="2"
                    error={errors.experience?.[index]?.years?.message}
                    className="w-24"
                  />
                </div>
                <div>
                  <FieldLabel>Description (optional)</FieldLabel>
                  <TextArea
                    {...register(`experience.${index}.description`)}
                    rows={2}
                    placeholder="Key achievements or technologies used..."
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendExp({ role: "", company: "", years: 1, description: "" })}
              className="flex items-center gap-2 rounded-md border border-dashed px-4 py-2.5 text-sm transition-colors hover:bg-[hsl(240_4%_14%)] w-full justify-center"
              style={{ borderColor: "hsl(240 5% 22%)", color: "hsl(240 4% 38%)" }}
            >
              <Plus className="h-4 w-4" />
              Add Experience Entry
            </button>
          </div>
        </Section>

        {/* 4. Salary */}
        <Section title="Salary Expectations" icon={DollarSign}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Min Salary</FieldLabel>
              <TextInput
                {...register("salaryMin")}
                type="number"
                placeholder="500000"
              />
            </div>
            <div>
              <FieldLabel>Max Salary</FieldLabel>
              <TextInput
                {...register("salaryMax")}
                type="number"
                placeholder="1000000"
              />
            </div>
            <div>
              <FieldLabel>Currency</FieldLabel>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "hsl(240 5% 18%)", color: "hsl(0 0% 98%)", backgroundColor: "hsl(240 10% 4%)" }}
                  >
                    {["KZT", "USD", "EUR", "RUB"].map((c) => (
                      <option key={c} value={c} style={{ backgroundColor: "hsl(240 6% 7%)" }}>{c}</option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
        </Section>

        {/* 5. Preferences */}
        <Section title="Preferences" icon={MapPin}>
          {/* Work formats */}
          <div>
            <FieldLabel>Work Format</FieldLabel>
            <div className="flex gap-3">
              {(["remote", "hybrid", "office"] as const).map((fmt) => (
                <Controller
                  key={fmt}
                  control={control}
                  name="workFormats"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value.includes(fmt)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...field.value, fmt]
                            : field.value.filter((f) => f !== fmt);
                          field.onChange(next);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize" style={{ color: "hsl(240 4% 65%)" }}>{fmt}</span>
                    </label>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <FieldLabel>Languages</FieldLabel>
            <Controller
              control={control}
              name="languages"
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} placeholder="Russian, English, Kazakh..." />
              )}
            />
          </div>

          {/* Cities */}
          <div>
            <FieldLabel>Preferred Cities</FieldLabel>
            <Controller
              control={control}
              name="cities"
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} placeholder="Almaty, Remote..." />
              )}
            />
          </div>
        </Section>

        {updateProfile.error && (
          <p className="text-sm" style={{ color: "hsl(0 72% 61%)" }}>
            Failed to save: {updateProfile.error.message}
          </p>
        )}
      </form>
    </div>
  );
}
