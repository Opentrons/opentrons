import { connect } from 'react-redux'
import { getAdditionalEquipmentEntities } from '../../../step-forms/selectors'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { StepFormDropdown } from './StepFormDropdownField'
import type { Options } from '@opentrons/components'
import type { AdditionalEquipmentEntities } from '@opentrons/step-generation'
import type { BaseState } from '../../../types'

interface SP {
  options: Options
  additionalEquipment: AdditionalEquipmentEntities
}

const mapSTP = (state: BaseState): SP => ({
  options: uiLabwareSelectors.getLabwareOptions(state),
  additionalEquipment: getAdditionalEquipmentEntities(state),
})

export const LabwareField = connect(mapSTP)(StepFormDropdown)
