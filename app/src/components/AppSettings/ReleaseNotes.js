// @flow
import * as React from 'react'
import remark from 'remark'
import reactRenderer from 'remark-react'
import styles from './styles.css'

type Props = {source: ?string}

const renderer = remark().use(reactRenderer, {
  remarkReactComponents: {div: React.Fragment},
})

export default function ReleaseNotes (props: Props) {
  const {source} = props
  if (!source) return null

  return (
    <div className={styles.release_notes}>
      {renderer.processSync(source).contents}
    </div>
  )
}
