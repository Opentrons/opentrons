// @flow
import { Icon } from '@opentrons/components'
import * as React from 'react'

import styles from './styles.css'

export type ExternalLinkProps = {
  href: string,
  children: React.Node,
}

export function ExternalLink(props: ExternalLinkProps): React.Node {
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
