// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {Icon, OutlineButton} from '@opentrons/components'

import styles from './styles.css'
import {SectionContentHalf} from '../layout'
type Props = {
  instrumentType: string,
  url: string,
}
export default function InstrumentWarning (props: Props) {
  const {instrumentType, url} = props
  return (
    <div>
    <SectionContentHalf>
    <div className={styles.instrument_warning}>
      <Icon name='alert' className={styles.status_icon}/>
      <div>
        <span className={styles.warning_text}>Required {instrumentType} is missing</span>
        <span className={styles.warning_text}>Attach correct {instrumentType} to continue.</span>
      </div>
    </div>
    </SectionContentHalf>
    <SectionContentHalf>
    <OutlineButton
      Component={Link}
      to={url}
      className={styles.instrument_button}
    >
      GO TO {instrumentType} SETUP
    </OutlineButton>
    </SectionContentHalf>
    </div>
  )
}
