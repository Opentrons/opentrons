// @flow
import * as React from 'react'
import LabwareOutline from './LabwareOutline'
import { CenteredTextSvg } from '../CenteredTextSvg'
import styles from './Labware.css'

// TODO: BC 2019-06-18 remove when old Labware component is no longer used anywhere
export default function FallbackLabware() {
  return (
    <g>
      <LabwareOutline />
      <CenteredTextSvg
        className={styles.fallback_plate_text}
        text="Custom Container"
      />
    </g>
  )
}
