// resources page layout
import * as React from 'react'
import { Card, OutlineButton } from '@opentrons/components'

import styles from './styles.css'

interface Props {
  title: React.ReactNode
  description: React.ReactNode
  url: string
}

export function ResourceCard(props: Props): JSX.Element {
  return (
    <Card title={props.title}>
      <div className={styles.card_content}>
        <p className={styles.link_label}>{props.description}</p>
        <OutlineButton
          Component="a"
          href={props.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link_button}
        >
          View in Browser
        </OutlineButton>
      </div>
    </Card>
  )
}
