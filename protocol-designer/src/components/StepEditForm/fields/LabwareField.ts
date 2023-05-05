import { Options } from '@opentrons/components'
import { connect } from 'react-redux'

import { BaseState } from '../../../types'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { StepFormDropdown } from './StepFormDropdownField'

interface SP {
  options: Options
}

const mapSTP = (state: BaseState): SP => ({
  options: uiLabwareSelectors.getLabwareOptions(state),
})

export const LabwareField = connect(mapSTP)(StepFormDropdown)
