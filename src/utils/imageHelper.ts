/**
 * Image & ImgBB Embed Utilities
 * Supports direct URLs, ImgBB HTML embed snippets, BBCode, and Markdown images.
 */

// Regular expressions for various embed formats
const HTML_IMG_SRC_REGEX = /<img[^>]+src=["']([^"'>]+)["']/i;
const BBCODE_IMG_REGEX = /\[img\]\s*([^\[\]\s]+)\s*\[\/img\]/i;
const MARKDOWN_IMG_REGEX = /!\[.*?\]\(\s*([^\s\)]+)(?:\s+["'].*?["'])?\s*\)/i;

/**
 * Extracts a clean direct image URL from raw user input.
 * Handles:
 * - ImgBB HTML embed code: <a href="..."><img src="https://i.ibb.co/..." ...></a>
 * - BBCode: [url=...][img]https://i.ibb.co/...[/img][/url]
 * - Markdown: ![alt](https://i.ibb.co/...)
 * - Plain image URL: https://i.ibb.co/...
 */
export function extractDirectImageUrl(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // 1. Check HTML <img ... src="...">
  const htmlMatch = trimmed.match(HTML_IMG_SRC_REGEX);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1].trim();
  }

  // 2. Check BBCode [img]...[/img]
  const bbMatch = trimmed.match(BBCODE_IMG_REGEX);
  if (bbMatch && bbMatch[1]) {
    return bbMatch[1].trim();
  }

  // 3. Check Markdown ![alt](...)
  const mdMatch = trimmed.match(MARKDOWN_IMG_REGEX);
  if (mdMatch && mdMatch[1]) {
    return mdMatch[1].trim();
  }

  // 4. Strip surrounding quotes, brackets, or trailing punctuation
  let clean = trimmed.replace(/^["'<(\[]+|[>"')\]]+$/g, '').trim();

  // If user pasted an ImgBB viewer link (ibb.co/xxx) without direct image
  // Note: ibb.co/XYZ is a web page, while i.ibb.co/XYZ/... is the raw image.
  return clean;
}

/**
 * Parses multi-line or block input containing multiple image links or embed codes.
 * Ideal for screenshots input textarea.
 */
export function parseMultipleImageUrls(input: string): string[] {
  if (!input || !input.trim()) return [];

  const results: string[] = [];

  // Match all HTML <img src="..."> in the text
  const htmlMatches = [...input.matchAll(/<img[^>]+src=["']([^"'>]+)["']/gi)];
  for (const m of htmlMatches) {
    if (m[1] && m[1].startsWith('http')) {
      results.push(m[1].trim());
    }
  }

  // Match all BBCode [img]...[/img] in the text
  const bbMatches = [...input.matchAll(/\[img\]\s*([^\[\]\s]+)\s*\[\/img\]/gi)];
  for (const m of bbMatches) {
    if (m[1] && m[1].startsWith('http')) {
      results.push(m[1].trim());
    }
  }

  // Match all Markdown ![...](...) in the text
  const mdMatches = [...input.matchAll(/!\[.*?\]\(\s*([^\s\)]+)(?:\s+["'].*?["'])?\s*\)/gi)];
  for (const m of mdMatches) {
    if (m[1] && m[1].startsWith('http')) {
      results.push(m[1].trim());
    }
  }

  // Also split by newlines for direct line-by-line URLs
  const lines = input.split(/[\r\n]+/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip if this line was already matched as HTML/BBCode/Markdown
    if (trimmed.includes('<img') || trimmed.includes('[img]') || trimmed.startsWith('![')) {
      continue;
    }
    const extracted = extractDirectImageUrl(trimmed);
    if (extracted && extracted.startsWith('http')) {
      results.push(extracted);
    }
  }

  // Return unique, non-empty URLs
  return Array.from(new Set(results));
}

/**
 * Checks whether an image URL is from ImgBB.
 */
export function isImgBbUrl(url: string): boolean {
  if (!url) return false;
  return /ibb\.co/i.test(url);
}

/**
 * Determines if a link is an ImgBB viewer page link rather than a direct image.
 */
export function isImgBbViewerPage(url: string): boolean {
  if (!url) return false;
  return /https?:\/\/(?:www\.)?ibb\.co\/[a-zA-Z0-9]+/i.test(url) && !/i\.ibb\.co/i.test(url);
}

/**
 * Fallback placeholder image URL when an image fails to load.
 */
export const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
