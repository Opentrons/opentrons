// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import {getWellSetForMultichannel} from '../well-selection/utils'
import {selectors as fileDataSelectors} from '../file-data'
import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import type {BaseState} from '../types'

import {openWellSelectionModal} from '../well-selection/actions'

import {InputField, FormGroup} from '@opentrons/components'

type OP = {
  formFieldAccessor: string,
  pipetteId?: string,
  labwareId?: string,
  initialSelectedWells: ?Array<string>
}

type SP = {
  numWells: ?number
}

type DP = {
  onClick?: (e: SyntheticMouseEvent<*>) => mixed
}

type Props = OP & SP & DP

function WellSelectorInput (props: Props) {
  const {labwareId, pipetteId, onClick, numWells} = props
  const disabled = !(labwareId && pipetteId)

  return (
    <FormGroup label='Wells:' disabled={disabled}>
      <InputField
        readOnly
        value={numWells ? `${numWells}` : ''}
        onClick={onClick}
      />
    </FormGroup>
  )
}

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const {pipetteId, labwareId, initialSelectedWells} = ownProps
  const pipetteData = pipetteId
    ? fileDataSelectors.equippedPipettes(state)[pipetteId]
    : null

  const labware = labwareId
    ? labwareIngredSelectors.getLabware(state)[labwareId]
    : null

  if (
    (pipetteData && pipetteData.channels === 1) ||
    !labwareId || !initialSelectedWells || !labware
  ) {
    // single-channel or empty fields
    return {
      numWells: initialSelectedWells && initialSelectedWells.length
    }
  }

  const wellSets = initialSelectedWells.map(well =>
    getWellSetForMultichannel(labware.type, well))

  return {
    numWells: uniq(flatten(wellSets)).length
  }
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

const ConnectedWellSelectorInput = connect(mapStateToProps, mapDispatchToProps)(WellSelectorInput)

export default ConnectedWellSelectorInput
