/**
 * Input sanitization utilities for preventing XSS and injection attacks
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return text.replace(/[&<>"'`=\/]/g, (s) => map[s]);
}

/**
 * Remove potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags and their content
  html = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove dangerous tags
  const dangerousTags = [
    "script",
    "object",
    "embed",
    "link",
    "style",
    "iframe",
    "frame",
    "frameset",
    "applet",
    "meta",
    "form",
    "input",
    "button",
    "textarea",
  ];

  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}\\b[^>]*>.*?<\\/${tag}>`, "gi");
    html = html.replace(regex, "");

    // Also remove self-closing versions
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/>`, "gi");
    html = html.replace(selfClosingRegex, "");
  });

  // Remove dangerous attributes
  const dangerousAttrs = [
    "onload",
    "onerror",
    "onclick",
    "onmouseover",
    "onmouseout",
    "onkeydown",
    "onkeyup",
    "onkeypress",
    "onfocus",
    "onblur",
    "onchange",
    "onsubmit",
    "onreset",
    "onselect",
    "onunload",
    "javascript:",
    "vbscript:",
    "data:",
  ];

  dangerousAttrs.forEach((attr) => {
    const regex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, "gi");
    html = html.replace(regex, "");
  });

  return html;
}

/**
 * Sanitize text input for database queries (basic SQL injection prevention)
 */
export function sanitizeForDatabase(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove or escape potentially dangerous SQL characters
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/"/g, '""') // Escape double quotes
    .replace(/;/g, "") // Remove semicolons
    .replace(/--/g, "") // Remove SQL comments
    .replace(/\/\*/g, "") // Remove SQL block comment start
    .replace(/\*\//g, "") // Remove SQL block comment end
    .trim();
}

/**
 * Validate and sanitize tweet content
 */
export function sanitizeTweetContent(content: string): string {
  if (typeof content !== "string") {
    throw new Error("Tweet content must be a string");
  }

  // Basic length validation
  if (content.length > 280) {
    throw new Error("Tweet content exceeds maximum length");
  }

  // Remove null bytes and control characters
  content = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Escape HTML to prevent XSS
  content = escapeHtml(content);

  // Additional sanitization for special characters that might cause issues
  content = content
    .replace(/[\u2028\u2029]/g, "") // Remove line/paragraph separators
    .trim();

  return content;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format and ensure it's safe
 */
export function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP and HTTPS protocols
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    // Block localhost and private IP ranges in production
    if (process.env.NODE_ENV === "production") {
      const hostname = parsedUrl.hostname.toLowerCase();

      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.")
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize user input for search queries
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== "string") {
    return "";
  }

  return query
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/['"]/g, "") // Remove quotes
    .replace(/[&]/g, "") // Remove ampersands
    .trim()
    .substring(0, 100); // Limit length
}

/**
 * Validate and sanitize numeric input
 */
export function sanitizeNumber(
  input: any,
  min?: number,
  max?: number,
): number | null {
  const num = Number(input);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Rate limit key sanitization
 */
export function sanitizeRateLimitKey(key: string): string {
  return key
    .replace(/[^a-zA-Z0-9:\-_]/g, "") // Only allow alphanumeric, colon, dash, underscore
    .substring(0, 100); // Limit length
}
