import Markdown from 'react-markdown'

import { CodeBlock } from './CodeBlock'
import styles from './enhancedmarkdown.module.css'

interface EnhancedMarkdownProps {
  content: string
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

            return <CodeBlock code={codeContent} />
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
