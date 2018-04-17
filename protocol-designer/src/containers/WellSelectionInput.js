// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import type {BaseState} from '../types'

import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors as fileDataSelectors} from '../file-data'
import {openWellSelectionModal} from '../steplist/actions'

import {InputField, type Channels} from '@opentrons/components'

type OP = {
  formFieldAccessor: string,
  pipetteId: string,
  labwareId: string,
  initialSelectedWells: ?Array<string>
}

type SP = {
  channels: Channels,
  labwareType: string,
}

type DP = {
  onClick: (e: SyntheticMouseEvent<*>) => mixed
}

type Props = OP & SP & DP

function WellSelectorInput (props: Props) {
  const {initialSelectedWells, channels, labwareType, onClick} = props
  const enabled = (channels && labwareType)

  return <InputField
    readOnly
    value={initialSelectedWells && `${initialSelectedWells.length} wells selected`}
    onClick={enabled ? onClick : undefined}
  />
}

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {pipetteId, labwareId} = ownProps
  return {
    channels: fileDataSelectors.equippedPipettes(state)[pipetteId].channels,
    labwareType: labwareIngredSelectors.getLabware(state)[labwareId].type
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}, ownProps: OP): Props {
  const {dispatch} = dispatchProps
  return {
    ...ownProps,
    ...stateProps,
    onClick: () => dispatch(openWellSelectionModal({
      ...stateProps,
      formFieldAccessor: ownProps.formFieldAccessor
    }))
  }
}

const ConnectedWellSelectorInput = connect(mapStateToProps, null, mergeProps)(WellSelectorInput)

const WellSelectorInputWrapper = (props: OP) => {
  if (props.pipetteId && props.labwareId) {
    return <ConnectedWellSelectorInput {...props} />
  }
  // fallback to unconnected & blank InputField
  // if pipetteId or labwareId not provided
  return <InputField readOnly />
}

export default WellSelectorInputWrapper
