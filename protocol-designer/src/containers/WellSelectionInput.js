// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'

import {openWellSelectionModal} from '../well-selection/actions'

import {InputField} from '@opentrons/components'

type OP = {
  formFieldAccessor: string,
  pipetteId: string,
  labwareId: string,
  initialSelectedWells: ?Array<string>
}

type SP = {}

type DP = {
  onClick: (e: SyntheticMouseEvent<*>) => mixed
}

type Props = OP & DP & SP

function WellSelectorInput (props: Props) {
  const {initialSelectedWells, labwareId, onClick} = props
  const enabled = !!(labwareId)

  return <InputField
    readOnly
    value={initialSelectedWells && `${initialSelectedWells.length} wells selected`}
    onClick={enabled ? onClick : undefined}
  />
}

function mapStateToProps (): SP {
  // TODO remove this?
  return {}
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}, ownProps: OP): Props {
  const {dispatch} = dispatchProps
  return {
    ...ownProps,
    onClick: () => dispatch(openWellSelectionModal({
      pipetteId: ownProps.pipetteId,
      labwareId: ownProps.labwareId,
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
