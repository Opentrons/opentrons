import * as React from 'react'
import Markdown from 'react-markdown'

import { StyledText } from '@opentrons/components'

import styles from './styles.module.css'

export interface ReleaseNotesProps {
  source?: string | null
}

const DEFAULT_RELEASE_NOTES = 'We recommend upgrading to the latest version.'

export function ReleaseNotes(props: ReleaseNotesProps): JSX.Element {
  const { source } = props

  return (
    <div className={styles.release_notes}>
      {source != null ? (
        <Markdown
          components={{
            div: undefined,
            ul: undefined,
            h2: HeaderText,
            li: ParagraphText,
            p: ParagraphText,
            a: ExternalLink,
          }}
        >
          {source}
        </Markdown>
      ) : (
        <p>{DEFAULT_RELEASE_NOTES}</p>
      )}
    </div>
  )
}

function ExternalLink(props: JSX.IntrinsicAttributes): JSX.Element {
  return <a {...props} target="_blank" rel="noopener noreferrer" />
}

function ParagraphText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <StyledText {...props} as="p" />
}

function HeaderText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <StyledText {...props} as="h3" />
}
