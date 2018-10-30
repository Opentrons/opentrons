// @flow
import {connect} from 'react-redux'
import assert from 'assert'
import LabwareDetailsCard from './LabwareDetailsCard'
import {selectors as labwareIngredSelectors} from '../../../labware-ingred/reducers'
import type {ElementProps} from 'react'
import type {Dispatch} from 'redux'
import type {BaseState} from '../../../types'

type Props = ElementProps<typeof LabwareDetailsCard>

type DP = {
  renameLabware: $PropertyType<Props, 'renameLabware'>,
}

type SP = $Diff<Props, DP>

function mapStateToProps (state: BaseState): SP {
  const labwareData = labwareIngredSelectors.getSelectedContainer(state)
  assert(labwareData, 'Expected labware data to exist in connected labware details card')

  return labwareData
    ? {
      labwareType: labwareData.type,
      nickname: labwareData.name || 'Unnamed Labware',
    }
    : {
      labwareType: '?',
      nickname: '?',
    }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DP {
  return {
    renameLabware: (name) => console.log('todo: save', name),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LabwareDetailsCard)
