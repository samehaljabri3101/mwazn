import { Injectable } from '@nestjs/common';

export interface ModerationResult {
  decision: 'ALLOW' | 'FLAG' | 'BLOCK';
  reasonCode?: string;
  matchedTerms?: string[];
}

/**
 * Platform content moderation service.
 * Applies deterministic rule-based checks against text fields.
 * Both English and Arabic terms are covered.
 */
@Injectable()
export class ModerationService {
  // ── BLOCK rules: content that must never be published ────────────────────

  private readonly BLOCK_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
    // Explicit content
    { pattern: /\b(porn|pornography|adult content|explicit content|xxx)\b/i, code: 'EXPLICIT_CONTENT' },
    { pattern: /\b(إباحي|محتوى إباحي|محتوى للكبار)\b/, code: 'EXPLICIT_CONTENT' },

    // Illegal drugs / controlled substances
    { pattern: /\b(heroin|cocaine|fentanyl|meth|methamphetamine|crack cocaine|drug dealer|sell drugs|buy drugs)\b/i, code: 'ILLEGAL_DRUGS' },
    { pattern: /\b(هيروين|كوكايين|مخدرات|تجارة مخدرات|حشيش|أفيون)\b/, code: 'ILLEGAL_DRUGS' },

    // Scam / pyramid patterns
    { pattern: /\b(guaranteed (profit|return|income)|100% profit|1000% (profit|return)|pyramid scheme|ponzi)\b/i, code: 'SCAM_PATTERN' },
    { pattern: /\b(ربح مضمون|عائد مضمون|مخطط هرمي|تنزيلات مضاعفة|ربح 100%)\b/, code: 'SCAM_PATTERN' },
    { pattern: /\b(get rich quick|instant millionaire|double your money)\b/i, code: 'SCAM_PATTERN' },
  ];

  // ── FLAG rules: suspicious content for admin review ──────────────────────

  private readonly FLAG_PATTERNS: Array<{ pattern: RegExp; code: string }> = [
    // Phone / contact info in text (bypass platform communication)
    { pattern: /(\+966|00966|\b05\d{8}\b|\b9665\d{8}\b)/, code: 'CONTACT_INFO_IN_TEXT' },
    { pattern: /\b(\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d[\s\-.]?\d)\b/, code: 'CONTACT_INFO_IN_TEXT' },
    { pattern: /\b(call me|whatsapp me|contact me directly|اتصل بي|تواصل معي مباشرة|رقمي)\b/i, code: 'CONTACT_INFO_IN_TEXT' },

    // External platform references (directing off-platform)
    { pattern: /\b(whatsapp|telegram|instagram|snapchat|واتساب|تيليجرام|انستغرام|سناب)\b/i, code: 'EXTERNAL_PLATFORM' },

    // Suspicious pricing claims
    { pattern: /\b(lowest price (guaranteed|in the world|in saudi)|أرخص سعر في العالم|أرخص من الجميع)\b/i, code: 'SUSPICIOUS_PRICING' },
    { pattern: /\b(below cost|selling at a loss|sell at cost|بأقل من التكلفة)\b/i, code: 'SUSPICIOUS_PRICING' },
  ];

  /**
   * Moderates a set of text fields.
   * Returns BLOCK if any BLOCK rule matches, FLAG if any FLAG rule matches, ALLOW otherwise.
   */
  moderate(fields: Record<string, string | undefined>): ModerationResult {
    const combined = Object.values(fields)
      .filter((v): v is string => typeof v === 'string')
      .join(' ');

    // Check BLOCK rules first
    for (const { pattern, code } of this.BLOCK_PATTERNS) {
      const match = combined.match(pattern);
      if (match) {
        return {
          decision: 'BLOCK',
          reasonCode: code,
          matchedTerms: match.slice(0, 3).map((m) => m.trim()),
        };
      }
    }

    // Check FLAG rules
    const flaggedTerms: string[] = [];
    let flagCode: string | undefined;
    for (const { pattern, code } of this.FLAG_PATTERNS) {
      const match = combined.match(pattern);
      if (match) {
        if (!flagCode) flagCode = code;
        flaggedTerms.push(...match.slice(0, 2).map((m) => m.trim()));
      }
    }
    if (flaggedTerms.length > 0) {
      return { decision: 'FLAG', reasonCode: flagCode, matchedTerms: flaggedTerms.slice(0, 5) };
    }

    return { decision: 'ALLOW' };
  }
}
