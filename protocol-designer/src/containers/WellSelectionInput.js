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

type DP = {
  onClick?: (e: SyntheticMouseEvent<*>) => mixed
}

type Props = OP & DP

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

function mapDispatchToProps (dispatch: Dispatch<*>, ownProps: OP): Props {
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

const ConnectedWellSelectorInput = connect(null, mapDispatchToProps)(WellSelectorInput)

export default ConnectedWellSelectorInput
