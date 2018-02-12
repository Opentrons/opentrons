// @flow
import * as React from 'react'

import {PrimaryButton} from '@opentrons/components'

import styles from './styles.css'

type RunButtonProps = {
  onClick: () => void,
  disabled: boolean
}
export default function RunButton (props: RunButtonProps) {
  const {onClick, disabled} = props
  return (
    <PrimaryButton
      disabled={disabled}
      onClick={onClick}
      className={styles.button_run}
    >
      Run Protocol
    </PrimaryButton>
  )
}
