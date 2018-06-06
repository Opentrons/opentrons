// @flow
// resources page layout
import * as React from 'react'

import ResourceCard from './ResourceCard'

import styles from './styles.css'

export default function Resources () {
  return (
    <div className={styles.resources_page}>
      <div className={styles.row}>
        <ResourceCard
          title='Knowledge Base'
          description='Visit our walkthroughs and FAQs'
          url={'https://support.opentrons.com/'}
        />
      </div>
      <div className={styles.row}>
        <ResourceCard
          title='Protocol Library'
          description='Download a protocol to run on your robot'
          url={'https://protocols.opentrons.com/'}
        />
      </div>
    </div>
  )
}
