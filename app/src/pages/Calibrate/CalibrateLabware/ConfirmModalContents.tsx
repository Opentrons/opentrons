// contents container for ConfirmModal
import * as React from 'react'
import { connect } from 'react-redux'

import { selectors as robotSelectors } from '../../../redux/robot'

import { ConfirmPositionContents } from './ConfirmPositionContents'
import { ConfirmPickupContents } from './ConfirmPickupContents'
import { InProgressContents } from './InProgressContents'

import type { State } from '../../../redux/types'
import type { Pipette, Labware } from '../../../redux/robot/types'

interface OP {
  labware: Labware
  calibrateToBottom: boolean
}

interface SP {
  calibrator: Pipette | null | undefined
  useCenteredTroughs: boolean
}

type Props = OP & SP

export const ConfirmModalContents = connect(mapStateToProps)(
  ConfirmModalContentsComponent
)

function ConfirmModalContentsComponent(props: Props): JSX.Element | null {
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
