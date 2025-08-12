// Python syntax highlighting utilities and constants

// Syntax color palette
export const PYTHON_SYNTAX_COLORS = {
  keyword: '#0000ff', // Blue for keywords
  builtin: '#795e26', // Brown for built-in functions
  string: '#a31515', // Red for strings
  number: '#098658', // Green for numbers
  comment: '#008000', // Green for comments
  functionCall: '#795e26', // Brown for function calls
  self: '#0070c1', // Light blue for self
  dictKey: '#9cdcfe', // Light blue for dict keys
} as const

// Regex patterns for Python syntax highlighting
export const PYTHON_REGEX_PATTERNS = {
  comment: /#.*$/g,
  string: /(["'])((?:\\.|(?!\1).)*?)\1/g,
  number: /\b\d+\.?\d*\b/g,
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

// Helper function to escape HTML characters
export const escapeHtml = (text: string): string => {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
