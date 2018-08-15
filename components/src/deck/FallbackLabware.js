// @flow
import * as React from 'react'
import LabwareOutline from './LabwareOutline'
import {CenteredTextSvg} from '../CenteredTextSvg'
import styles from './Labware.css'

export default function FallbackLabware () {
  return (
    <g>
      <LabwareOutline />
      <CenteredTextSvg
        className={styles.fallback_plate_text}
        text='Custom Container'
      />
    </g>
  )
}
