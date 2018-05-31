// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'

import {openWellSelectionModal} from '../well-selection/actions'

import {InputField, FormGroup} from '@opentrons/components'

type OP = {
  className?: ?string,
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
  const {initialSelectedWells, labwareId, pipetteId, onClick, className} = props
  const disabled = !(labwareId && pipetteId)

  return (
    <FormGroup label='Wells:' disabled={disabled} className={className}>
      <InputField
        readOnly
        value={initialSelectedWells && `${initialSelectedWells.length}`} // TODO Ian 2018-04-27 use selector to get num wells * 8 if multi-channel
        onClick={onClick}
      />
    </FormGroup>
  )
}

function mapDispatchToProps (dispatch: Dispatch<*>, ownProps: OP): DP {
  const {pipetteId, labwareId, formFieldAccessor} = ownProps

  if (pipetteId && labwareId) {
    return {
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
