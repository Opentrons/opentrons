import {
  HEATERSHAKER_MODULE_TYPE,
  ModuleModel,
  getAreSlotsAdjacent,
} from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import { useSelector } from 'react-redux'
import {
  selectors as stepFormSelectors,
  actions as stepFormActions,
  getSlotIsEmpty,
  getSlotsBlockedBySpanning,
  getLabwareOnSlot,
} from '../../../step-forms'
import { getLabwareIsCompatible } from '../../../utils/labwareModuleCompatibility'
import { some } from 'lodash'

export interface EditModulesFormValues {
  selectedModel: ModuleModel | null
  selectedType: string
  initialDeckSetup: any
  //   moduleOnDeck: ModuleModel | null
}

export const validator = ({
  selectedModel,
  selectedType,
  initialDeckSetup,
}: EditModulesFormValues): Record<string, any> => {
  const errors: Record<string, any> = {}
  if (!selectedModel) {
    errors.selectedModel = i18n.t('alert.field.required')
  }
  const selectedSlot = selectedModel?.slot
  const isModuleAdjacentToHeaterShaker =
    // if the module is a heater shaker, it can't be adjacent to another heater shaker
    // because PD does not support MoaM
    selectedType !== HEATERSHAKER_MODULE_TYPE &&
    some(
      initialDeckSetup.modules,
      hwModule =>
        hwModule.type === HEATERSHAKER_MODULE_TYPE &&
        getAreSlotsAdjacent(hwModule.slot, selectedSlot)
    )

  if (isModuleAdjacentToHeaterShaker) {
    errors.selectedSlot = i18n.t(
      'alert.module_placement.HEATER_SHAKER_ADJACENT_TO_MODULE.body',
      { selectedSlot }
    )
  } else if (
    selectedType === HEATERSHAKER_MODULE_TYPE &&
    !hasSlotIssue(selectedSlot, initialDeckSetup, selectedType)
  ) {
    const isHeaterShakerAdjacentToAnotherModule = some(
      initialDeckSetup.modules,
      hwModule =>
        getAreSlotsAdjacent(hwModule.slot, selectedSlot) &&
        // if the other module is a heater shaker it's the same heater shaker (reflecting current state)
        // since the form has not been saved yet and PD does not support MoaM
        hwModule.type !== HEATERSHAKER_MODULE_TYPE
    )
    if (isHeaterShakerAdjacentToAnotherModule) {
      errors.selectedSlot = i18n.t(
        'alert.module_placement.HEATER_SHAKER_ADJACENT_TO_ANOTHER_MODULE.body',
        { selectedSlot }
      )
    }
  } else if (hasSlotIssue(selectedSlot, initialDeckSetup, selectedType)) {
    errors.selectedSlot = i18n.t('alert.module_placement.SLOT_OCCUPIED.body', {
      selectedSlot,
    })
  } else if (!selectedSlot) {
    // in the event that we remove auto selecting selected slot
    errors.selectedSlot = i18n.t('alert.field.required')
  }

  return errors
}

const hasSlotIssue = (
  selectedSlot: string,
  initialDeckSetup: any,
  moduleType: any
): boolean => {
  const isSlotBlocked = getSlotsBlockedBySpanning(initialDeckSetup).includes(
    selectedSlot
  )
  const isSlotEmpty = getSlotIsEmpty(initialDeckSetup, selectedSlot)
  const labwareOnSlot = getLabwareOnSlot(initialDeckSetup, selectedSlot)
  const isLabwareCompatible =
    labwareOnSlot && getLabwareIsCompatible(labwareOnSlot.def, moduleType)

  if (isSlotEmpty && !isSlotBlocked) {
    return false
  }

  return !isLabwareCompatible
}
