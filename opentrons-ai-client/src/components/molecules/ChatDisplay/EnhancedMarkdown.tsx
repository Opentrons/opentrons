import { useState } from 'react'
import Markdown from 'react-markdown'

import { Icon, SPACING } from '@opentrons/components'

import styles from './enhancedmarkdown.module.css'

interface EnhancedMarkdownProps {
  content: string
}

interface CodeBlockActionsProps {
  code: string
}

interface CodeBlockProps {
  children: string
}

// Light theme syntax colors
const syntaxColors = {
  keyword: '#0000ff', // Blue for keywords
  builtin: '#795e26', // Brown for built-in functions
  string: '#a31515', // Red for strings
  number: '#098658', // Green for numbers
  comment: '#008000', // Green for comments
  functionCall: '#795e26', // Brown for function calls
  self: '#0070c1', // Light blue for self
}

// Python syntax highlighting with improved pattern matching
const highlightPythonSyntax = (code: string): JSX.Element[] => {
  const lines = code.split('\n')

  return lines.map((line, lineIndex) => {
    // Escape HTML characters first
    const processedLine = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Create tokens with positions to avoid overlapping
    const tokens: Array<{
      start: number
      end: number
      color: string
      style?: string
    }> = []

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
    const commentRegex = /#.*$/g
    let match
    while ((match = commentRegex.exec(line)) !== null) {
      addToken(match, syntaxColors.comment, 'font-style: italic;')
    }

    // 2. Strings (second highest priority)
    const stringRegex = /(["'])((?:\\.|(?!\1).)*?)\1/g
    while ((match = stringRegex.exec(line)) !== null) {
      addToken(match, syntaxColors.string)
    }

    // 3. Numbers
    const numberRegex = /\b\d+\.?\d*\b/g
    while ((match = numberRegex.exec(line)) !== null) {
      addToken(match, syntaxColors.number)
    }

    // 4. Keywords
    const keywordRegex = /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|pass|break|continue|raise|assert|yield|lambda|global|nonlocal|del|is|in|not|and|or|True|False|None)\b/g
    while ((match = keywordRegex.exec(line)) !== null) {
      addToken(match, syntaxColors.keyword, 'font-weight: 500;')
    }

    // 5. Built-in functions
    const builtinRegex = /\b(print|len|range|int|str|float|bool|list|dict|set|tuple|type|input|open|file|help|dir|abs|all|any|bin|chr|ord|hex|oct|round|sorted|sum|min|max|zip|map|filter|enumerate|reversed|slice|super|property|isinstance|issubclass|hasattr|getattr|setattr|delattr|callable|eval|exec|compile|vars|locals|globals)\b/g
    while ((match = builtinRegex.exec(line)) !== null) {
      addToken(match, syntaxColors.builtin)
    }

    // 6. Function calls (identifier followed by opening parenthesis)
    const functionRegex = /\b(\w+)(?=\()/g
    while ((match = functionRegex.exec(line)) !== null) {
      addToken(match, syntaxColors.functionCall)
    }

    // 7. Method calls (dot notation)
    const methodRegex = /\.(\w+)(?=\()/g
    while ((match = methodRegex.exec(line)) !== null) {
      // Create a match object for just the method name (without the dot)
      const methodMatch: RegExpExecArray = {
        0: match[1],
        index: (match.index ?? 0) + 1,
        input: match.input,
        groups: match.groups,
      }
      addToken(methodMatch, syntaxColors.functionCall)
    }

    // 8. Self parameter
    const selfRegex = /\bself\b/g
    while ((match = selfRegex.exec(line)) !== null) {
      addToken(match, syntaxColors.self, 'font-style: italic;')
    }

    // 9. Dictionary keys (strings followed by colon in dict context)
    const dictKeyRegex = /(["'])([^"']+)\1(?=\s*:)/g
    while ((match = dictKeyRegex.exec(line)) !== null) {
      addToken(match, '#9cdcfe') // Light blue for dict keys
    }

    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start)

    // Build the final HTML string
    let result = ''
    let lastEnd = 0

    tokens.forEach(token => {
      // Add text before this token
      if (token.start > lastEnd) {
        result += processedLine.substring(lastEnd, token.start)
      }

      // Add the styled token
      const styleAttr = [`color: ${token.color}`, token.style ?? '']
        .filter((item): item is string => Boolean(item))
        .join('; ')

      const tokenText = processedLine.substring(token.start, token.end)
      result += `<span style="${styleAttr}">${tokenText}</span>`

      lastEnd = token.end
    })

    // Add remaining text after last token
    if (lastEnd < processedLine.length) {
      result += processedLine.substring(lastEnd)
    }

    return (
      <div
        key={lineIndex}
        dangerouslySetInnerHTML={{
          __html: result.length > 0 ? result : '\u00A0',
        }}
      />
    )
  })
}

const CodeBlockActions: React.FC<CodeBlockActionsProps> = ({ code }) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownload = (): void => {
    try {
      const blob = new Blob([code], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'OpentronsAI.py'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download code:', err)
    }
  }

  return (
    <div className={styles.copy_button_container}>
      <span className={styles.language_badge}>Python</span>
      <div className={styles.button_group}>
        <button
          className={styles.copy_button}
          onClick={() => {
            void handleCopy()
          }}
          title={isCopied ? 'Copied!' : 'Copy code'}
        >
          <Icon
            name={isCopied ? 'check' : 'content-copy'}
            size={SPACING.spacing16}
          />
        </button>
        <button
          className={styles.copy_button}
          onClick={handleDownload}
          title="Download as .py file"
        >
          <Icon name="download" size={SPACING.spacing16} />
        </button>
      </div>
    </div>
  )
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children }) => {
  return (
    <div className={styles.code_block_wrapper}>
      <CodeBlockActions code={children} />
      <pre className={styles.code_block}>
        <code className={styles.python_code}>
          {highlightPythonSyntax(children)}
        </code>
      </pre>
    </div>
  )
}

export const EnhancedMarkdown: React.FC<EnhancedMarkdownProps> = ({
  content,
}) => {
  return (
    <div className={styles.enhanced_markdown}>
      <Markdown
        components={{
          code: ({
            node,
            inline,
            className,
            children,
            ...props
          }: {
            node?: any
            inline?: boolean
            className?: string
            children: React.ReactNode
            [key: string]: any
          }) => {
            if (inline === true) {
              return (
                <code className={styles.inline_code}>{String(children)}</code>
              )
            }

            const codeContent = String(children).trim()

            // Check if it's a simple function call or short code snippet that should be inline
            const isShortCode =
              codeContent.length <= 50 && // Short length
              !codeContent.includes('\n') && // Single line
              (/^\w+\(\)$/.test(codeContent) || // Simple function call like "transfer()"
                /^\w+\([^)]*\)$/.test(codeContent) || // Function with simple params
                /^[\w.]+$/.test(codeContent) || // Simple identifier or property access
                codeContent.split(' ').length <= 5) // Very short code snippets

            if (isShortCode) {
              return <code className={styles.inline_code}>{codeContent}</code>
            }

            return <CodeBlock>{codeContent}</CodeBlock>
          },
          // Simple styling for other elements
          p: ({ children }) => <p className={styles.paragraph}>{children}</p>,
          ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.list}>{children}</ol>,
          li: ({ children }) => (
            <li className={styles.list_item}>{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className={`${styles.heading} ${styles.heading_h1}`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`${styles.heading} ${styles.heading_h2}`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`${styles.heading} ${styles.heading_h3}`}>
              {children}
            </h3>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}
