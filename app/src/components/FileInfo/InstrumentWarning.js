// @flow
import * as React from 'react'
import {Link} from 'react-router-dom'
import {OutlineButton} from '@opentrons/components'

import styles from './styles.css'
import {SectionContentHalf} from '../layout'

type Props = {
  instrumentType: string,
  url: string,
}

export default function InstrumentWarning (props: Props) {
  const {instrumentType, url} = props
  return (
    <SectionContentHalf className={styles.align_center}>
      <OutlineButton
        Component={Link}
        to={url}
        className={styles.instrument_button}
      >
        GO TO {instrumentType} SETUP
      </OutlineButton>
      <p className={styles.instrument_warning}>Required {instrumentType} is missing</p>
    </SectionContentHalf>
  )
}
