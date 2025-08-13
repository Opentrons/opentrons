import {
  PYTHON_REGEX_PATTERNS,
  PYTHON_SYNTAX_COLORS,
} from '/ai-client/components/molecules/CodeBlock/pythonSyntaxUtils'
import { CodeBlockToolbar } from '/ai-client/components/molecules/CodeBlockToolbar'

import styles from './codeblock.module.css'

import type { SyntaxToken } from '/ai-client/components/molecules/CodeBlock/pythonSyntaxUtils'

interface CodeBlockProps {
  code: string
}

const FONT_WEIGHT_MEDIUM = 'font-weight: 500;'
const FONT_STYLE_ITALIC = 'font-style: italic;'

const highlightPythonSyntax = (code: string): JSX.Element[] => {
  const lines = code.split('\n')

  return lines.map((line, lineIndex) => {
    // Create tokens with positions to avoid overlapping
    const tokens: SyntaxToken[] = []

    // Helper function to add token if no overlap
    const addToken = (
      match: RegExpExecArray,
      color: string,
      style?: string
    ): void => {
      const start = match.index ?? 0
      const end = start + match[0].length

      // Check for overlaps with existing tokens
      const hasOverlap = tokens.some(
        token => start < token.end && end > token.start
      )

      if (!hasOverlap) {
        tokens.push({ start, end, color, style })
      }
    }

    // 1. Comments (highest priority)
    let match
    PYTHON_REGEX_PATTERNS.comment.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.comment.exec(line)) !== null) {
      addToken(match, PYTHON_SYNTAX_COLORS.comment, FONT_STYLE_ITALIC)
    }

    // 2. Strings (second highest priority)
    PYTHON_REGEX_PATTERNS.text.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.text.exec(line)) !== null) {
      addToken(match, PYTHON_SYNTAX_COLORS.text)
    }

    // 3. Numbers
    PYTHON_REGEX_PATTERNS.literal.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.literal.exec(line)) !== null) {
      addToken(match, PYTHON_SYNTAX_COLORS.literal)
    }

    // 4. Keywords
    PYTHON_REGEX_PATTERNS.keyword.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.keyword.exec(line)) !== null) {
      addToken(match, PYTHON_SYNTAX_COLORS.keyword, FONT_WEIGHT_MEDIUM)
    }

    // 5. Built-in functions
    PYTHON_REGEX_PATTERNS.builtin.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.builtin.exec(line)) !== null) {
      addToken(match, PYTHON_SYNTAX_COLORS.builtin)
    }

    // 6. Function calls (identifier followed by opening parenthesis)
    PYTHON_REGEX_PATTERNS.functionCall.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.functionCall.exec(line)) !== null) {
      addToken(match, PYTHON_SYNTAX_COLORS.functionCall)
    }

    // 7. Method calls (dot notation)
    PYTHON_REGEX_PATTERNS.methodCall.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.methodCall.exec(line)) !== null) {
      // Create a match object for just the method name (without the dot)
      const methodMatch = Object.assign([], match[1]) as RegExpExecArray
      methodMatch.index = (match.index ?? 0) + 1
      methodMatch.input = match.input
      addToken(methodMatch, PYTHON_SYNTAX_COLORS.functionCall)
    }

    // 8. Self parameter
    PYTHON_REGEX_PATTERNS.self.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.self.exec(line)) !== null) {
      addToken(match, PYTHON_SYNTAX_COLORS.self, FONT_STYLE_ITALIC)
    }

    // 9. Dictionary keys (strings followed by colon in dict context)
    PYTHON_REGEX_PATTERNS.dictKey.lastIndex = 0
    while ((match = PYTHON_REGEX_PATTERNS.dictKey.exec(line)) !== null) {
      addToken(match, PYTHON_SYNTAX_COLORS.dictKey)
    }

    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start)

    // Build React elements for the line
    const elements: JSX.Element[] = []
    let lastEnd = 0

    tokens.forEach((token, tokenIndex) => {
      // Add text before this token
      if (token.start > lastEnd) {
        const text = line.substring(lastEnd, token.start)
        if (text) {
          elements.push(<span key={`text-${tokenIndex}`}>{text}</span>)
        }
      }

      // Add the styled token
      const style: React.CSSProperties = {
        color: token.color,
      }

      if (token.style?.includes('italic')) {
        style.fontStyle = 'italic'
      }
      if (token.style?.includes('500')) {
        style.fontWeight = 500
      }

      const tokenText = line.substring(token.start, token.end)
      elements.push(
        <span key={`token-${tokenIndex}`} style={style}>
          {tokenText}
        </span>
      )

      lastEnd = token.end
    })

    // Add remaining text after last token
    if (lastEnd < line.length) {
      const text = line.substring(lastEnd)
      if (text) {
        elements.push(<span key="text-end">{text}</span>)
      }
    }

    // Return line with content or non-breaking space for empty lines
    return (
      <div key={lineIndex}>{elements.length > 0 ? elements : '\u00A0'}</div>
    )
  })
}

export function CodeBlock({ code }: CodeBlockProps): JSX.Element {
  return (
    <div className={styles.code_block_wrapper}>
      <CodeBlockToolbar code={code} />
      <pre className={styles.code_block}>
        <code className={styles.python_code}>
          {highlightPythonSyntax(code)}
        </code>
      </pre>
    </div>
  )
}
