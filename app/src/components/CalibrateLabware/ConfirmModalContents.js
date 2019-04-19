// @flow
// contents container for ConfirmModal
import * as React from 'react'
import { connect } from 'react-redux'

import {
  selectors as robotSelectors,
  type Pipette,
  type Labware,
} from '../../robot'

import ConfirmPositionContents from './ConfirmPositionContents'
import ConfirmPickupContents from './ConfirmPickupContents'
import InProgressContents from './InProgressContents'

type OP = {| labware: Labware, calibrateToBottom: boolean |}

type SP = {| calibrator: ?Pipette |}

type Props = { ...OP, ...SP }

export default connect<Props, OP, _, _, _, _>(mapStateToProps)(
  ConfirmModalContents
)

function ConfirmModalContents(props: Props) {
  const { labware, calibrator, calibrateToBottom } = props
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
        />
      )

    case 'picked-up': {
      return <ConfirmPickupContents labware={labware} calibrator={calibrator} />
    }

    case 'moving-to-slot':
    case 'picking-up':
    case 'dropping-tip':
    case 'confirming':
      return <InProgressContents {...props} />

    default:
      return null
  }
}

function mapStateToProps(state, ownProps: OP): SP {
  const { calibratorMount } = ownProps.labware
  const pipettes = robotSelectors.getPipettes(state)
  const calibrator =
    pipettes.find(i => i.mount === calibratorMount) ||
    robotSelectors.getCalibrator(state)

  return { calibrator }
}
