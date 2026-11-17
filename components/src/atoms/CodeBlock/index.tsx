import styles from './codeblock.module.css'

import type { ReactNode } from 'react'

interface CodeBlockProps {
  children: ReactNode | string
}

export function CodeBlock({ children }: CodeBlockProps): ReactNode {
  return <code className={styles.container}>{children}</code>
}
