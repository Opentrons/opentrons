// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter, type Match} from 'react-router'

import type {State, Dispatch} from '../../types'

import {
  selectors as robotSelectors,
  actions as robotActions,
  type Mount,
  type SessionModule,
} from '../../robot'

import {Module as ModuleItem} from '@opentrons/components'
import type {LabwareComponentProps} from '@opentrons/components'
import LabwareItem, {type LabwareItemProps} from './LabwareItem'

type OP = LabwareComponentProps & {match: Match}

type SP = {
  _calibrator?: ?Mount,
  _labware?: $PropertyType<LabwareItemProps, 'labware'>,
  module?: SessionModule,
}

type DP = {dispatch: Dispatch}

type Props = LabwareComponentProps & {
  labware?: $PropertyType<LabwareItemProps, 'labware'>,
  module?: SessionModule,
}

export default withRouter(connect(mapStateToProps, null, mergeProps)(SlotItem))

function SlotItem (props: Props) {
  const {slot, width, height, labware, module} = props

  return (
    <React.Fragment>
      {module && (
        <ModuleItem name={module.name} mode='default' />
      )}
      {labware && (
        <LabwareItem
          labware={labware}
          module={module}
          slot={slot}
          height={height}
          width={width}
        />
      )}
    </React.Fragment>
  )
}

function mapStateToProps (state: State, ownProps: OP): SP {
  const {slot, match: {params: {slot: selectedSlot}}} = ownProps
  const allLabware = robotSelectors.getLabware(state)
  const tipracksConfirmed = robotSelectors.getTipracksConfirmed(state)
  const labware = allLabware.find((lw) => lw.slot === slot)
  const highlighted = slot === selectedSlot
  const module = robotSelectors.getModulesBySlot(state)[slot]

  const stateProps: SP = {}

  if (labware) {
    const {isTiprack, confirmed, calibratorMount} = labware

    stateProps._calibrator = (
      calibratorMount ||
      robotSelectors.getCalibratorMount(state)
    )

    stateProps._labware = {
      ...labware,
      highlighted,
      disabled: (isTiprack && confirmed) || (!isTiprack && !tipracksConfirmed),
      showName: highlighted || confirmed,
      showUnconfirmed: true,
      showSpinner: highlighted && labware.calibration === 'moving-to-slot',
      url: `/calibrate/labware/${slot}`,
    }
  }

  if (module) stateProps.module = module

  return stateProps
}

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {_labware, _calibrator} = stateProps
  const {dispatch} = dispatchProps
  const allProps: Props = {...ownProps, ...stateProps}

  if (_labware) {
    allProps.labware = {
      ..._labware,
      onClick: () => {
        if (_calibrator && (!_labware.isTiprack || !_labware.confirmed)) {
          dispatch(robotActions.moveTo(_calibrator, _labware.slot))
        }
      },
    }
  }

  return allProps
}
