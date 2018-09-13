import * as React from 'react'
import {Icon} from '@opentrons/components'
import i18n from '../localization'
import styles from './WellSelectionInstructions.css'

export default function WellSelectionInstructions () {
  return (
    <div className={styles.wrapper}>
      <Icon className={styles.click_drag_icon} name='ot-click-and-drag' />
      <div className={styles.instructional_text}>
        <p>{i18n.t('well_selection_instructions.instructions1')}</p>
        <p>{i18n.t('well_selection_instructions.instructions2')}</p>
      </div>
    </div>
  )
}
