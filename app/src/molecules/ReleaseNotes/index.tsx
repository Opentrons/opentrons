import * as React from 'react'
import remark from 'remark'
import reactRenderer from 'remark-react'
import styles from './styles.css'
import { StyledText } from '../../atoms/text'
export interface ReleaseNotesProps {
  source?: string | null
}

// ToDo (kk:09/22/2023) This component should be updated in the future
// since the package we use hasn't been updated more than 2 years.
// Also the creator recommends users to replace remark-react with rehype-react.
const renderer = remark().use(reactRenderer, {
  remarkReactComponents: {
    div: React.Fragment,
    h2: HeaderText,
    ul: React.Fragment,
    li: ParagraphText,
    p: ParagraphText,
    a: ExternalLink,
  },
})

const DEFAULT_RELEASE_NOTES = 'We recommend upgrading to the latest version.'

export function ReleaseNotes(props: ReleaseNotesProps): JSX.Element {
  const { source } = props

  return (
    <div className={styles.release_notes}>
      {source != null ? (
        renderer.processSync(source).contents
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
