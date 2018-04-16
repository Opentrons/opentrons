// @ flow
import * as React from 'react'

import SelectablePlate from '../containers/SelectablePlate.js'
import {SLOT_WIDTH, SLOT_HEIGHT} from '../constants.js'
import styles from './SingleLabware.css'

export default function SingleLabware () {
  return (
    <div className={styles.single_labware}>
      <svg width='100%' height='100%' viewBox={`0 0 ${SLOT_WIDTH} ${SLOT_HEIGHT}`}>
        <SelectablePlate showLabels selectable />
      </svg>
    </div>
  )
}
