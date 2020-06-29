// @flow
// contents container for ConfirmModal
import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as robotSelectors } from '../../robot'
import type { Labware, Pipette } from '../../robot/types'
import type { Dispatch, State } from '../../types'
import { ConfirmPickupContents } from './ConfirmPickupContents'
import { ConfirmPositionContents } from './ConfirmPositionContents'
import { InProgressContents } from './InProgressContents'

type OP = {| labware: Labware, calibrateToBottom: boolean |}

type SP = {| calibrator: ?Pipette, useCenteredTroughs: boolean |}

type Props = {| ...OP, ...SP, dispatch: Dispatch |}

export const ConfirmModalContents: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  {||},
  _,
  _
>(mapStateToProps)(ConfirmModalContentsComponent)

function ConfirmModalContentsComponent(props: Props) {
  const { labware, calibrator, calibrateToBottom, useCenteredTroughs } = props
  if (!calibrator) return null

  switch (labware.calibration) {
    case 'unconfirmed':
    case 'over-slot':
    case 'jogging':
      return (
        <ConfirmPositionContents
          labware={labware}
          calibrator={calibrator}
          calibrateToBottom={calibrateToBottom}
          useCenteredTroughs={useCenteredTroughs}
        />
      )

    case 'picked-up': {
      return <ConfirmPickupContents labware={labware} calibrator={calibrator} />
    }

    case 'moving-to-slot':
    case 'picking-up':
    case 'dropping-tip':
    case 'confirming':
      return <InProgressContents />

    default:
      return null
  }
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { calibratorMount } = ownProps.labware
  const pipettes = robotSelectors.getPipettes(state)
  const calibrator =
    pipettes.find(i => i.mount === calibratorMount) ||
    robotSelectors.getCalibrator(state)
  const apiLevel = robotSelectors.getApiLevel(state)
  const useCenteredTroughs = apiLevel !== null && apiLevel[0] > 1

  return { calibrator, useCenteredTroughs }
}
