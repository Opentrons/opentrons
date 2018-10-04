// @flow
import * as React from 'react'
import remark from 'remark'
import reactRenderer from 'remark-react'
import styles from './styles.css'

type Props = {
  source: ?string,
}

const renderer = remark().use(reactRenderer, {
  remarkReactComponents: {
    div: React.Fragment,
    a: ExternalLink,
  },
})

const DEFAULT_RELEASE_NOTES = 'We recommend upgrading to the latest version.'

export default function ReleaseNotes (props: Props) {
  const {source} = props

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

function ExternalLink (props) {
  return <a {...props} target="_blank" rel="noopener noreferrer" />
}
