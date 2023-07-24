import { connect } from 'react-redux'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { StepFormDropdown } from './StepFormDropdownField'
import type { Options } from '@opentrons/components'
import type { BaseState } from '../../../types'

interface SP {
  options: Options
}

const mapSTP = (state: BaseState): SP => ({
  options: uiLabwareSelectors.getTiprackOptions(state),
})

export const TiprackField = connect(mapSTP)(StepFormDropdown)
