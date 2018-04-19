// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'

import {openWellSelectionModal} from '../well-selection/actions'

import {InputField, FormGroup} from '@opentrons/components'

type OP = {
  formFieldAccessor: string,
  pipetteId?: string,
  labwareId?: string,
  initialSelectedWells: ?Array<string>
}

type SP = {}

type DP = {
  onClick?: (e: SyntheticMouseEvent<*>) => mixed
}

type Props = OP & DP & SP

function WellSelectorInput (props: Props) {
  const {initialSelectedWells, labwareId, pipetteId, onClick} = props
  const disabled = !(labwareId && pipetteId)

  return (
    <FormGroup label='Wells:' disabled={disabled}>
      <InputField
        readOnly
        value={initialSelectedWells && `${initialSelectedWells.length}`}
        onClick={onClick}
      />
    </FormGroup>
  )
}

function mapStateToProps (): SP {
  // TODO remove this?
  return {}
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}, ownProps: OP): Props {
  const {dispatch} = dispatchProps
  const {pipetteId, labwareId, formFieldAccessor} = ownProps

  if (pipetteId && labwareId) {
    return {
      ...ownProps,
      onClick: () => dispatch(openWellSelectionModal({
        pipetteId: pipetteId,
        labwareId: labwareId,
        formFieldAccessor: formFieldAccessor
      }))
    }
  }
  // disabled
  return {...ownProps}
}

const ConnectedWellSelectorInput = connect(mapStateToProps, null, mergeProps)(WellSelectorInput)

export default ConnectedWellSelectorInput
