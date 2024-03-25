import * as React from 'react'
import { Icon } from '@opentrons/components'
import styles from './styles.module.css'

export interface ExternalLinkProps {
  href: string
  children: React.ReactNode
}

export function ExternalLink(props: ExternalLinkProps): JSX.Element {
  const { href, children } = props

  return (
    <a
      className={styles.external_link}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <Icon className={styles.icon} name="open-in-new" />
    </a>
  )
}
