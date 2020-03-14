// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { TitledList } from '@opentrons/components'
import { LabwareListItem } from './LabwareListItem'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import type { State, Dispatch } from '../../types'
import type { Labware, Mount, Slot, SessionModule } from '../../robot'

type SP = {|
  disabled: boolean,
  labware: Array<Labware>,
  modulesBySlot: { [Slot]: SessionModule },
  _calibrator: ?Mount,
  _deckPopulated: boolean,
|}

type DP = {| dispatch: Dispatch |}

type Props = {|
  labware: Array<Labware>,
  modulesBySlot: { [Slot]: SessionModule },
  disabled: boolean,
  setLabware: (labware: Labware) => mixed,
|}

export const LabwareList = withRouter<{||}, _>(
  connect<Props, _, SP, {||}, State, Dispatch>(
    mapStateToProps,
    null,
    mergeProps
  )(LabwareListComponent)
)

function LabwareListComponent(props: Props) {
  const { labware, disabled, setLabware, modulesBySlot } = props

  return (
    <TitledList title="labware">
      {labware.map(lw => (
        <LabwareListItem
          {...lw}
          key={lw.slot}
          moduleModel={
            modulesBySlot &&
            modulesBySlot[lw.slot] &&
            modulesBySlot[lw.slot].model
          }
          isDisabled={disabled}
          onClick={() => setLabware(lw)}
        />
      ))}
    </TitledList>
  )
}

function mapStateToProps(state: State): SP {
  return {
    labware: robotSelectors.getNotTipracks(state),
    modulesBySlot: robotSelectors.getModulesBySlot(state),
    disabled: !robotSelectors.getTipracksConfirmed(state),
    _calibrator: robotSelectors.getCalibratorMount(state),
    _deckPopulated: Boolean(robotSelectors.getDeckPopulated(state)),
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP): Props {
  const {
    labware,
    modulesBySlot,
    disabled,
    _calibrator,
    _deckPopulated,
  } = stateProps
  const { dispatch } = dispatchProps

  return {
    labware,
    modulesBySlot,
    disabled,
    setLabware: lw => {
      const calibrator = lw.calibratorMount || _calibrator
      if (_deckPopulated && calibrator) {
        dispatch(robotActions.moveTo(calibrator, lw.slot))
      }
    },
  }
}
