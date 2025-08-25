// Python syntax highlighting utilities and constants

// Syntax color palette
export const PYTHON_SYNTAX_COLORS = {
  keyword: '#0000ff', // Blue for keywords
  builtin: '#267f99', // Teal for built-in functions
  text: '#a31515', // Red for string literals
  literal: '#098658', // Green for numeric literals
  comment: '#008000', // Green for comments
  functionCall: '#795e26', // Brown for function calls
  self: '#0070c1', // Light blue for Python's self keyword
  dictKey: '#9cdcfe', // Light blue for dict keys
} as const

// Regex patterns for Python syntax highlighting
export const PYTHON_REGEX_PATTERNS = {
  comment: /#.*$/g,
  text: /(["'])((?:\\.|(?!\1).)*?)\1/g,
  literal: /\b\d+\.?\d*\b/g,
  keyword: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|pass|break|continue|raise|assert|yield|lambda|global|nonlocal|del|is|in|not|and|or|True|False|None)\b/g,
  builtin: /\b(print|len|range|int|str|float|bool|list|dict|set|tuple|type|input|open|file|help|dir|abs|all|any|bin|chr|ord|hex|oct|round|sorted|sum|min|max|zip|map|filter|enumerate|reversed|slice|super|property|isinstance|issubclass|hasattr|getattr|setattr|delattr|callable|eval|exec|compile|vars|locals|globals)\b/g,
  functionCall: /\b(\w+)(?=\()/g,
  methodCall: /\.(\w+)(?=\()/g,
  self: /\bself\b/g,
  dictKey: /(["'])([^"']+)\1(?=\s*:)/g,
} as const

// Token type for syntax highlighting
export interface SyntaxToken {
  start: number
  end: number
  color: string
  style?: string
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped text safe for HTML insertion
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 */
export const escapeHtml = (text: string): string => {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Regex patterns for detecting inline code vs code blocks
export const INLINE_CODE_PATTERNS = {
  simpleFunctionCall: /^\w+\(\)$/, // Simple function call like "transfer()"
  functionWithParams: /^\w+\([^)]*\)$/, // Function with simple params
  simpleIdentifier: /^[\w.]+$/, // Simple identifier or property access
} as const

// Constants for inline code detection
const MAX_INLINE_CODE_LENGTH = 50
const MAX_INLINE_WORD_COUNT = 5

/**
 * Determines if code content should be displayed as inline code or a code block
 * @param codeContent - The code content to check
 * @returns True if the code should be displayed inline, false for code block
 * @example
 * isInlineCode('print()') // Returns: true
 * isInlineCode('def long_function():\n    pass') // Returns: false
 */
export const isInlineCode = (codeContent: string): boolean => {
  const trimmedCode = codeContent.trim()

  return (
    trimmedCode.length <= MAX_INLINE_CODE_LENGTH && // Short length
    !trimmedCode.includes('\n') && // Single line
    (INLINE_CODE_PATTERNS.simpleFunctionCall.test(trimmedCode) ||
      INLINE_CODE_PATTERNS.functionWithParams.test(trimmedCode) ||
      INLINE_CODE_PATTERNS.simpleIdentifier.test(trimmedCode) ||
      trimmedCode.split(' ').length <= MAX_INLINE_WORD_COUNT) // Very short code snippets
  )
}
