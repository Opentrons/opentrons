// @flow
import * as React from 'react'
import {Icon, TitleBar, VerticalNavBar} from '@opentrons/components'
import styles from './ProtocolEditor.css'
import ConnectedStepEditForm from '../containers/ConnectedStepEditForm'
import ConnectedStepList from '../containers/ConnectedStepList'

export default function ProtocolEditor () {
  return (
    <div className={styles.wrapper}>
      <VerticalNavBar className={styles.nav_bar}>
        <Icon name='file' />
        <Icon name='cog' />
      </VerticalNavBar>
      <ConnectedStepList />
      <div className={styles.main_page_wrapper}>
        {/* TODO Ian 2018-01-24 Connect TitleBar, figure out when it changes */}
        <TitleBar title='Title' subtitle='Subtitle' />

        <div className={styles.main_page_content}>
          <ConnectedStepEditForm />
          {'Deck map goes here! '.repeat(200)}
        </div>
      </div>
    </div>
  )
}
