import Markdown from 'react-markdown'

import { CodeBlock } from '/ai-client/components/molecules/CodeBlock'
import { isInlineCode } from '/ai-client/components/molecules/CodeBlock/pythonSyntaxUtils'

import styles from './enhancedmarkdown.module.css'

import type { Element } from 'hast'
import type { ReactElement, ReactNode } from 'react'

interface EnhancedMarkdownProps {
  content: string
}

interface CodeComponentProps {
  node?: Element
  inline?: boolean
  className?: string
  children: ReactNode
}

const renderCode = ({
  node: _node,
  inline,
  className: _className,
  children,
}: CodeComponentProps): ReactElement => {
  if (inline === true) {
    return <code className={styles.inline_code}>{String(children)}</code>
  }

  const codeContent = String(children).trim()

  // Check if it's a simple function call or short code snippet that should be inline
  if (isInlineCode(codeContent)) {
    return <code className={styles.inline_code}>{codeContent}</code>
  }

  return <CodeBlock code={codeContent} />
}

export function EnhancedMarkdown({
  content,
}: EnhancedMarkdownProps): JSX.Element {
  return (
    <div className={styles.enhanced_markdown}>
      <Markdown
        components={{
          code: renderCode,
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
