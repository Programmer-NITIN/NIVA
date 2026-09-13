"use client";

import React, { useState } from "react";
import { VolumeIcon, SparklesIcon, BrainIcon, ShieldIcon } from "@/components/icons";

interface FormattedCopilotOutputProps {
  content: string;
  language?: string;
  isSpeaking?: boolean;
  onSpeak?: (text: string) => void;
  onStopSpeak?: () => void;
  onQuickPrompt?: (prompt: string) => void;
}

export default function FormattedCopilotOutput({
  content,
  language = "en",
  isSpeaking = false,
  onSpeak,
  onStopSpeak,
  onQuickPrompt,
}: FormattedCopilotOutputProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleToggleSpeak() {
    if (isSpeaking) {
      if (onStopSpeak) {
        onStopSpeak();
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      if (onSpeak) {
        onSpeak(getSpeechCleanText(content));
      }
    }
  }

  // Clean speech text for natural audio synthesis (strip markdown syntax)
  function getSpeechCleanText(text: string): string {
    return text
      .replace(/###?\s*/g, "")
      .replace(/\|/g, " ")
      .replace(/[-*]\s+/g, "")
      .replace(/\*\*/g, "")
      .replace(/>\s*/g, "")
      .replace(/---/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Parse markdown content into structured blocks
  const blocks = parseMarkdownBlocks(content);

  return (
    <div
      style={{
        marginTop: 18,
        borderRadius: "var(--radius-md)",
        background: "var(--niva-canvas)",
        border: "1px solid var(--niva-border)",
        boxShadow: "0 8px 32px -6px rgba(14, 19, 17, 0.08)",
        overflow: "hidden",
        animation: "fadeSlideUp 0.35s ease forwards",
      }}
    >
      {/* Top Intelligence Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "12px 18px",
          background: "linear-gradient(135deg, #163300 0%, #0d2200 100%)",
          color: "#ffffff",
          borderBottom: "1px solid rgba(142, 242, 68, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(142, 242, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(142, 242, 68, 0.4)",
            }}
          >
            <BrainIcon size={16} color="var(--niva-electric-lime)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 13, letterSpacing: "-0.01em", color: "#ffffff" }}>
                NIVA Financial Advisor
              </strong>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "var(--radius-pill)",
                  background: "rgba(142, 242, 68, 0.2)",
                  color: "var(--niva-electric-lime)",
                  border: "1px solid rgba(142, 242, 68, 0.35)",
                }}
              >
                <SparklesIcon size={10} color="var(--niva-electric-lime)" />
                Groq openai/gpt-oss-120b
              </span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.7)", marginTop: 1 }}>
              Deterministic AI • RBI Account Aggregator Telemetry
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(onSpeak || onStopSpeak) && (
            <button
              onClick={handleToggleSpeak}
              style={{
                background: isSpeaking ? "rgba(225, 29, 72, 0.35)" : "rgba(255, 255, 255, 0.1)",
                border: isSpeaking ? "1.5px solid #ff4d6d" : "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "var(--radius-pill)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                fontSize: 11,
                color: isSpeaking ? "#ff8da1" : "#ffffff",
                fontWeight: 700,
                transition: "all 0.2s ease",
              }}
              title={isSpeaking ? "Click to stop speaking immediately" : "Listen to financial advice aloud"}
            >
              {isSpeaking ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      background: "#ff4d6d",
                      borderRadius: 2,
                    }}
                  />
                  <span>
                    {language === "hi"
                      ? "रोकें (Stop)"
                      : language === "gu"
                      ? "અટકાવો (Stop)"
                      : "Stop Audio"}
                  </span>
                </>
              ) : (
                <>
                  <VolumeIcon size={14} color="currentColor" />
                  <span>
                    {language === "hi" ? "सुनें (Voice)" : language === "gu" ? "સાંભળો (Voice)" : "Audio"}
                  </span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleCopy}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "var(--radius-pill)",
              cursor: "pointer",
              padding: "5px 12px",
              fontSize: 11,
              color: "#ffffff",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
            title="Copy response text"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Main Formatted Content Body */}
      <div style={{ padding: "20px 24px", color: "var(--niva-obsidian)" }}>
        {blocks.map((block, index) => (
          <RenderBlock key={index} block={block} />
        ))}
      </div>

      {/* Bottom Follow-up Prompt Suggestions */}
      {onQuickPrompt && (
        <div
          style={{
            padding: "12px 24px",
            background: "var(--niva-canvas-subtle)",
            borderTop: "1px solid var(--niva-border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--niva-text-muted)" }}>
            FOLLOW-UP:
          </span>
          {[
            language === "hi" ? "इमरजेंसी बफर सुरक्षित रखने के विकल्प?" : "How do I protect my emergency buffer?",
            language === "hi" ? "किस्त (EMI) का विकल्प दिखाएं" : "Show 6-month EMI impact",
            language === "hi" ? "खर्च का पूरा विवरण दिखाएं" : "Show spending breakdown",
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => onQuickPrompt(prompt)}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--niva-border)",
                background: "#ffffff",
                color: "var(--niva-deep-forest)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--niva-deep-forest)")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--niva-border)")}
            >
              💬 {prompt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Block Parser Logic ────────────────────────────────────────────────────────

interface Block {
  type: "header" | "table" | "bullet_list" | "quote" | "divider" | "paragraph";
  level?: number;
  title?: string;
  rows?: string[][];
  items?: string[];
  text?: string;
}

function parseMarkdownBlocks(rawText: string): Block[] {
  const blocks: Block[] = [];
  const lines = rawText.split("\n");

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Divider
    if (/^---$|^___$|^\*\*\*$/.test(trimmed)) {
      blocks.push({ type: "divider" });
      i++;
      continue;
    }

    // Headers (### Header)
    if (trimmed.startsWith("### ")) {
      blocks.push({
        type: "header",
        level: 3,
        title: trimmed.replace(/^###\s+/, ""),
      });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({
        type: "header",
        level: 2,
        title: trimmed.replace(/^##\s+/, ""),
      });
      i++;
      continue;
    }
    if (trimmed.startsWith("#### ")) {
      blocks.push({
        type: "header",
        level: 4,
        title: trimmed.replace(/^####\s+/, ""),
      });
      i++;
      continue;
    }

    // Markdown Table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        const rowTrim = lines[i].trim();
        // Skip separator row |---|---|
        if (!/^[|\s-:]+$/.test(rowTrim)) {
          const cells = rowTrim
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());
          tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        blocks.push({ type: "table", rows: tableRows });
      }
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: quoteLines.join(" ") });
      continue;
    }

    // Bullet List
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ""));
        i++;
      }
      blocks.push({ type: "bullet_list", items });
      continue;
    }

    // Regular paragraph
    blocks.push({ type: "paragraph", text: trimmed });
    i++;
  }

  return blocks;
}

// ─── Block Renderer ───────────────────────────────────────────────────────────

function RenderBlock({ block }: { block: Block }) {
  if (block.type === "header") {
    return (
      <div
        style={{
          marginTop: 20,
          marginBottom: 10,
          paddingBottom: 6,
          borderBottom: "1.5px solid rgba(22, 51, 0, 0.12)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: block.level === 2 ? 18 : 16,
            fontWeight: 800,
            color: "var(--niva-deep-forest)",
            letterSpacing: "-0.015em",
          }}
        >
          {renderInlineText(block.title || "")}
        </span>
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <hr
        style={{
          border: "none",
          height: "1px",
          background: "linear-gradient(90deg, transparent, var(--niva-border), transparent)",
          margin: "18px 0",
        }}
      />
    );
  }

  if (block.type === "table" && block.rows && block.rows.length > 0) {
    const headers = block.rows[0];
    const dataRows = block.rows.slice(1);

    return (
      <div
        style={{
          margin: "14px 0",
          overflowX: "auto",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--niva-border)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ background: "var(--niva-canvas-subtle)", borderBottom: "2px solid var(--niva-border)" }}>
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: "10px 14px",
                    fontWeight: 700,
                    color: "var(--niva-deep-forest)",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  {renderInlineText(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rIdx) => (
              <tr
                key={rIdx}
                style={{
                  borderBottom: rIdx === dataRows.length - 1 ? "none" : "1px solid var(--niva-border)",
                  background: rIdx % 2 === 0 ? "var(--niva-canvas)" : "rgba(244, 244, 240, 0.5)",
                  transition: "background 0.15s ease",
                }}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    style={{
                      padding: "10px 14px",
                      color: "var(--niva-obsidian)",
                      verticalAlign: "top",
                      lineHeight: 1.5,
                    }}
                  >
                    <RenderTableCellContent text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "bullet_list" && block.items) {
    return (
      <ul style={{ margin: "10px 0 14px 0", paddingLeft: 0, listStyle: "none" }}>
        {block.items.map((item, idx) => (
          <li
            key={idx}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              marginBottom: 8,
              fontSize: 13,
              lineHeight: 1.55,
              color: "var(--niva-obsidian)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--niva-deep-forest)",
                marginTop: 7,
                flexShrink: 0,
              }}
            />
            <div>{renderInlineText(item)}</div>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "quote" && block.text) {
    return (
      <div
        style={{
          margin: "14px 0",
          padding: "12px 16px",
          background: "rgba(142, 242, 68, 0.08)",
          borderLeft: "3px solid var(--niva-deep-forest)",
          borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          fontSize: 12.5,
          lineHeight: 1.5,
          color: "var(--niva-deep-forest)",
        }}
      >
        <ShieldIcon size={16} color="var(--niva-deep-forest)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>{renderInlineText(block.text)}</div>
      </div>
    );
  }

  // Paragraph
  return (
    <p
      style={{
        margin: "8px 0",
        fontSize: 13.5,
        lineHeight: 1.6,
        color: "var(--niva-obsidian)",
      }}
    >
      {renderInlineText(block.text || "")}
    </p>
  );
}

// ─── Cell Content Formatter (Badge / Rupee Detection) ──────────────────────────

function RenderTableCellContent({ text }: { text: string }) {
  const clean = text.trim();

  // Status badges: ❌ Not affordable
  if (clean.includes("❌") || clean.toLowerCase().includes("not affordable")) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: "var(--radius-pill)",
          background: "var(--niva-critical-bg)",
          color: "var(--niva-critical)",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {renderInlineText(clean)}
      </span>
    );
  }

  // Status badges: ✅ Affordable / Safe
  if (clean.includes("✅") || clean.toLowerCase().includes("affordable") || clean.toLowerCase().includes("safe")) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 10px",
          borderRadius: "var(--radius-pill)",
          background: "var(--niva-positive-bg)",
          color: "var(--niva-positive)",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        {renderInlineText(clean)}
      </span>
    );
  }

  // Rupee amount styling
  if (clean.startsWith("₹") || clean.startsWith("**₹")) {
    return (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: "var(--niva-deep-forest)",
          fontSize: 13,
        }}
      >
        {renderInlineText(clean)}
      </span>
    );
  }

  return <span>{renderInlineText(clean)}</span>;
}

// ─── Inline Markdown Formatter (**bold**, `code`, etc.) ───────────────────────

function renderInlineText(text: string): React.ReactNode {
  // Match **bold** and `code`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      const boldText = token.slice(2, -2);
      parts.push(
        <strong key={match.index} style={{ fontWeight: 700, color: "var(--niva-deep-forest)" }}>
          {boldText}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      const codeText = token.slice(1, -1);
      parts.push(
        <code
          key={match.index}
          style={{
            background: "rgba(0,0,0,0.06)",
            padding: "2px 5px",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: "0.9em",
          }}
        >
          {codeText}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
