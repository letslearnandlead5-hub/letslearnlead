import React from 'react';
import { View, Text, StyleSheet, TextStyle, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../theme';

interface MathTextProps {
  content?: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  color?: string;
  fontSize?: number;
}

// ── Greek and Math Unicode Symbols ───────────────────────────────────────────
const GREEK_MAP: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε',
  zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ',
  lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
  rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ', phi: 'φ',
  chi: 'χ', psi: 'ψ', omega: 'ω',
  Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε',
  Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ',
  Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  times: '×', div: '÷', pm: '±', mp: '∓', cdot: '·',
  leq: '≤', geq: '≥', neq: '≠', approx: '≈', infty: '∞',
  partial: '∂', nabla: '∇', sum: '∑', int: '∫', prod: '∏',
  rightarrow: '→', Rightarrow: '⇒', leftarrow: '←', Leftarrow: '⇐',
  leftrightarrow: '↔', Leftrightarrow: '⇔', degree: '°', circ: '°',
};

const SUP_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ',
};

const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ',
};

// ── HTML Entity Decoder ───────────────────────────────────────────────────────
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&deg;/g, '°')
    .replace(/&plusmn;/g, '±')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// ── Plain-Text Math Fraction Preprocessor ────────────────────────────────────
function preprocessMathText(raw: string): string {
  if (!raw) return '';
  let text = decodeHtmlEntities(raw);

  // Strip HTML tags except standard text breaks
  text = text.replace(/<\/(p|div|li)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (_, content) => `^{${content}}`);
  text = text.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (_, content) => `_{${content}}`);
  text = text.replace(/<[^>]+>/g, '');

  // Convert sqrt(x) -> \sqrt{x}
  text = text.replace(/\bsqrt\(([^()]+)\)/gi, '\\sqrt{$1}');

  // Convert (a+b)/(c+d) -> \frac{a+b}{c+d}
  text = text.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');

  // Convert (a+b)/c -> \frac{a+b}{c}
  text = text.replace(/\(([^()]+)\)\s*\/\s*([a-zA-Z0-9_\^]+)/g, '\\frac{$1}{$2}');

  // Convert a/(b+c) -> \frac{a}{b+c}
  text = text.replace(/([a-zA-Z0-9_\^]+)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');

  // Convert plain math numbers/variables: "y = a/b - c/d", "1/2", "3/4", "x/y"
  text = text.replace(/(^|[\s=\+\-\*\(])([a-zA-Z0-9_\^]+)\s*\/\s*([a-zA-Z0-9_\^]+)(?=[\s=\+\-\*\)]|$)/g, (match, prefix, num, den) => {
    // Preserve common non-math units & dates like 2025/26 or km/h
    if (/\b(?:km\/h|m\/s|kg\/m|mol\/L|20\d\d\/\d\d)\b/i.test(match)) return match;
    if (num.length > 3 && den.length > 3 && isNaN(Number(num)) && isNaN(Number(den))) return match;
    return `${prefix}\\frac{${num}}{${den}}`;
  });

  return text;
}

// ── Tokenizer for LaTeX & Math Content ────────────────────────────────────────
type MathToken =
  | { type: 'text'; value: string }
  | { type: 'fraction'; num: string; den: string }
  | { type: 'sqrt'; value: string }
  | { type: 'sup'; value: string }
  | { type: 'sub'; value: string };

function parseMathTokens(input: string): MathToken[] {
  const tokens: MathToken[] = [];
  let s = input;

  // Extract LaTeX fractions: \frac{num}{den}
  const fracRegex = /\\frac\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/;
  const sqrtRegex = /\\sqrt\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/;

  while (s.length > 0) {
    const fracMatch = s.match(fracRegex);
    const sqrtMatch = s.match(sqrtRegex);

    // Find earliest match
    let earliestMatch: { type: 'frac' | 'sqrt'; match: RegExpMatchArray; index: number } | null = null;

    if (fracMatch && fracMatch.index !== undefined) {
      earliestMatch = { type: 'frac', match: fracMatch, index: fracMatch.index };
    }
    if (sqrtMatch && sqrtMatch.index !== undefined) {
      if (!earliestMatch || sqrtMatch.index < earliestMatch.index) {
        earliestMatch = { type: 'sqrt', match: sqrtMatch, index: sqrtMatch.index };
      }
    }

    if (!earliestMatch) {
      // Process remaining plain text for symbols, sub, sup
      tokens.push({ type: 'text', value: s });
      break;
    }

    // Text before match
    if (earliestMatch.index > 0) {
      const textBefore = s.slice(0, earliestMatch.index);
      tokens.push({ type: 'text', value: textBefore });
    }

    if (earliestMatch.type === 'frac') {
      tokens.push({
        type: 'fraction',
        num: earliestMatch.match[1] || '',
        den: earliestMatch.match[2] || '',
      });
      s = s.slice(earliestMatch.index + earliestMatch.match[0].length);
    } else if (earliestMatch.type === 'sqrt') {
      tokens.push({
        type: 'sqrt',
        value: earliestMatch.match[1] || '',
      });
      s = s.slice(earliestMatch.index + earliestMatch.match[0].length);
    }
  }

  return tokens;
}

function formatTextSymbols(text: string): string {
  let res = text;

  // Replace \command with Unicode symbol
  res = res.replace(/\\([a-zA-Z]+)/g, (match, cmd) => {
    return GREEK_MAP[cmd] || match;
  });

  // Clean remaining $ delimiters
  res = res.replace(/\$\$/g, '').replace(/\$/g, '');

  // Convert ^{n} to superscript
  res = res.replace(/\^\{([^}]+)\}|\^([a-zA-Z0-9\+\-])/g, (_, group, single) => {
    const chars = group || single || '';
    return chars.split('').map((c: string) => SUP_MAP[c] || c).join('');
  });

  // Convert _{n} to subscript
  res = res.replace(/_\{([^}]+)\}|_([a-zA-Z0-9\+\-])/g, (_, group, single) => {
    const chars = group || single || '';
    return chars.split('').map((c: string) => SUB_MAP[c] || c).join('');
  });

  return res;
}

export const MathText: React.FC<MathTextProps> = ({
  content,
  style,
  containerStyle,
  color = Colors.text,
  fontSize = 15,
}) => {
  if (!content) return null;

  const preprocessed = preprocessMathText(content);
  const tokens = parseMathTokens(preprocessed);

  // If no complex fractions/roots, render as high-performance single Text
  const hasComplex = tokens.some((t) => t.type === 'fraction' || t.type === 'sqrt');

  if (!hasComplex) {
    return (
      <Text style={[{ fontSize, color, lineHeight: fontSize * 1.4 }, style]}>
        {formatTextSymbols(preprocessed)}
      </Text>
    );
  }

  const fracFontSize = Math.max(11, Math.round(fontSize * 0.82));

  return (
    <View style={[styles.inlineContainer, containerStyle]}>
      {tokens.map((token, index) => {
        if (token.type === 'text') {
          const formatted = formatTextSymbols(token.value);
          if (!formatted) return null;
          return (
            <Text
              key={index}
              style={[
                { fontSize, color, lineHeight: fontSize * 1.4 },
                style,
              ]}
            >
              {formatted}
            </Text>
          );
        }

        if (token.type === 'fraction') {
          const formattedNum = formatTextSymbols(token.num);
          const formattedDen = formatTextSymbols(token.den);

          return (
            <View key={index} style={styles.fractionWrapper}>
              <Text
                style={[
                  styles.fractionText,
                  { fontSize: fracFontSize, color },
                  style,
                ]}
              >
                {formattedNum}
              </Text>
              <View style={[styles.fractionLine, { backgroundColor: color }]} />
              <Text
                style={[
                  styles.fractionText,
                  { fontSize: fracFontSize, color },
                  style,
                ]}
              >
                {formattedDen}
              </Text>
            </View>
          );
        }

        if (token.type === 'sqrt') {
          const formattedInner = formatTextSymbols(token.value);
          return (
            <View key={index} style={styles.sqrtWrapper}>
              <Text style={[{ fontSize: fontSize * 1.1, color }, style]}>√</Text>
              <View style={[styles.sqrtOverline, { borderTopColor: color }]}>
                <Text style={[{ fontSize, color }, style]}>{formattedInner}</Text>
              </View>
            </View>
          );
        }

        return null;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  inlineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
  },
  fractionWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    marginVertical: 1,
  },
  fractionText: {
    textAlign: 'center',
    paddingHorizontal: 2,
    fontWeight: '600',
    lineHeight: 14,
  },
  fractionLine: {
    height: 1.2,
    width: '100%',
    marginVertical: 1,
    minWidth: 10,
  },
  sqrtWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sqrtOverline: {
    borderTopWidth: 1.2,
    paddingTop: 1,
    paddingHorizontal: 1,
  },
});

export default MathText;
