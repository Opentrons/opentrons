// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Icon } from '@opentrons/components'
import * as fileDataSelectors from '../file-data/selectors'
import styles from './ComputingSpinner.css'

export const ComputingSpinner = (): React.Node => {
  const showSpinner = useSelector(fileDataSelectors.getTimelineIsBeingComputed)
  return (
    showSpinner && (
      <div className={styles.overlay} data-test="ComputingSpinner">
        <Icon name="ot-spinner" className={styles.spinner_icon} spin />
      </div>
    )
  )
}
