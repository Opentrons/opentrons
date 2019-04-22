// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'

import { TitledList } from '@opentrons/components'
import LabwareListItem from './LabwareListItem'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import type { State, Dispatch } from '../../types'
import type { Labware, Mount } from '../../robot'

type SP = {|
  disabled: boolean,
  labware: Array<Labware>,
  _calibrator: ?Mount,
  _deckPopulated: boolean,
|}

type DP = {| dispatch: Dispatch |}

type Props = {
  labware: Array<Labware>,
  disabled: boolean,
  setLabware: (labware: Labware) => mixed,
}

export default withRouter<{||}>(
  connect<Props, _, SP, {||}, State, Dispatch>(
    mapStateToProps,
    null,
    mergeProps
  )(LabwareList)
)

function LabwareList(props: Props) {
  const { labware, disabled, setLabware } = props

  return (
    <TitledList title="labware" disabled={disabled}>
      {labware.map(lw => (
        <LabwareListItem
          {...lw}
          key={lw.slot}
          isDisabled={disabled}
          confirmed={lw.confirmed}
          onClick={() => setLabware(lw)}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps(state: State): SP {
  return {
    labware: robotSelectors.getNotTipracks(state),
    disabled: !robotSelectors.getTipracksConfirmed(state),
    _calibrator: robotSelectors.getCalibratorMount(state),
    _deckPopulated: robotSelectors.getDeckPopulated(state),
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP): Props {
  const { labware, disabled, _calibrator, _deckPopulated } = stateProps
  const { dispatch } = dispatchProps

  return {
    labware,
    disabled,
    setLabware: lw => {
      const calibrator = lw.calibratorMount || _calibrator
      if (_deckPopulated && calibrator) {
        dispatch(robotActions.moveTo(calibrator, lw.slot))
      }
    },
  }
}
