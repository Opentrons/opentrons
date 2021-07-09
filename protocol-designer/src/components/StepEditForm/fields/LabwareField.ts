import { connect } from 'react-redux'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { StepFormDropdown } from './StepFormDropdownField'
import { Options } from '@opentrons/components'
import { BaseState } from '../../../types'

interface SP {
  options: Options
}

const mapSTP = (state: BaseState): SP => ({
  options: uiLabwareSelectors.getLabwareOptions(state),
})

export const LabwareField = connect(mapSTP)(StepFormDropdown)
