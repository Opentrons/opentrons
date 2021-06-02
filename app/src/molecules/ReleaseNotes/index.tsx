import * as React from 'react'
import remark from 'remark'
import reactRenderer from 'remark-react'
import styles from './styles.css'

export interface ReleaseNotesProps {
  source?: string | null
}

const renderer = remark().use(reactRenderer, {
  remarkReactComponents: {
    div: React.Fragment,
    a: ExternalLink,
  },
})

const DEFAULT_RELEASE_NOTES = 'We recommend upgrading to the latest version.'

export function ReleaseNotes(props: ReleaseNotesProps): JSX.Element {
  const { source } = props

  return (
    <div className={styles.release_notes}>
      {source ? (
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
