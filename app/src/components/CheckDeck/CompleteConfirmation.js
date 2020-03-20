// @flow
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { Icon, PrimaryButton } from '@opentrons/components'
import type { Dispatch } from '../../types'
import { completeDeckCheck } from '../../calibration'
import styles from './styles.css'

const END_DECK_CHECK_HEADER = 'Calibration check is complete'
const END_DECK_CHECK_BODY =
  "You have successfully checked the accuracy of this robot's calibration."
const END_DECK_CHECK_BUTTON_TEXT = 'Drop tip and exit'

type CompleteConfirmationProps = {|
  robotName: string,
  exit: () => mixed,
|}
export function CompleteConfirmation(props: CompleteConfirmationProps) {
  const { robotName, exit } = props
  const dispatch = useDispatch<Dispatch>()
  React.useEffect(() => {
    dispatch(completeDeckCheck(robotName))
  }, [dispatch, robotName])

  return (
    <>
      <div className={styles.modal_header}>
        <Icon name="check-circle" className={styles.status_icon} />
        <h3>{END_DECK_CHECK_HEADER}</h3>
      </div>
      <p className={styles.complete_body}>{END_DECK_CHECK_BODY}</p>
      <PrimaryButton onClick={exit}>{END_DECK_CHECK_BUTTON_TEXT}</PrimaryButton>
    </>
  )
}
