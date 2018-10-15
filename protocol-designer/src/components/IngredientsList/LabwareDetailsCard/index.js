// @flow
import {connect} from 'react-redux'
import assert from 'assert'
import LabwareDetailsCard from './LabwareDetailsCard'
import {selectors as labwareIngredSelectors} from '../../../labware-ingred/reducers'
import type {ElementProps} from 'react'
import type {BaseState} from '../../../types'

type Props = ElementProps<typeof LabwareDetailsCard>

function mapStateToProps (state: BaseState): Props {
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

export default connect(mapStateToProps)(LabwareDetailsCard)
