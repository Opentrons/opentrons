// @flow
import React from 'react'
import { useSelector } from 'react-redux'
import { Formik } from 'formik'
import { i18n } from '../../../localization'
import {
  getSlotsBlockedBySpanning,
  getSlotIsEmpty,
  getLabwareOnSlot,
} from '../../../step-forms/utils'
import { getLabwareIsCompatible } from '../../../utils/labwareModuleCompatibility'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { PDAlert } from '../../alerts/PDAlert'
import { FormGroup } from '../../../../../components/src/forms/FormGroup'
import { DropdownField } from '../../../../../components/src/forms/DropdownField'
import type { ModuleRealType } from '@opentrons/shared-data'
import {
  getAllModuleSlotsByType,
  SUPPORTED_MODULE_SLOTS,
} from '../../../modules'

type EditModulesModalProps = {
  moduleType: ModuleRealType,
  moduleId: ?string,
  onCloseClick: () => mixed,
}
export const EditModulesModalNew = (props: EditModulesModalProps) => {
  const { moduleType } = props
  const initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const moduleOnDeck = props.moduleId
    ? initialDeckSetup.modules[props.moduleId]
    : null
  const supportedModuleSlot = SUPPORTED_MODULE_SLOTS[moduleType][0].value

  const initialValues = {
    selectedSlot: moduleOnDeck?.slot || supportedModuleSlot,
    selectedModel: moduleOnDeck?.model || null,
  }

  return (
    <Formik onSubmit={() => null} initialValues={initialValues}>
      {({ values, handleChange }) => {
        const selectedSlot = values.selectedSlot
        const previousModuleSlot = moduleOnDeck?.slot

        const slotError: boolean = showSlotError({
          initialDeckSetup,
          moduleType,
          selectedSlot,
          previousModuleSlot,
        })

        return (
          <>
            {slotError && (
              <PDAlert
                alertType="warning"
                title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
                description={''}
              />
            )}
          </>
        )
      }}
    </Formik>
  )
}
//  WHY does this work? shouldn't this not get hoisted???
const showSlotError = ({
  initialDeckSetup,
  moduleType,
  selectedSlot,
  previousModuleSlot,
}): boolean => {
  const slotsBlockedBySpanning = getSlotsBlockedBySpanning(initialDeckSetup)
  const slotIsEmpty =
    !slotsBlockedBySpanning.includes(selectedSlot) &&
    (getSlotIsEmpty(initialDeckSetup, selectedSlot) ||
      previousModuleSlot === selectedSlot)

  if (slotIsEmpty) {
    return false
  } else {
    const labwareOnSlot = getLabwareOnSlot(initialDeckSetup, selectedSlot)
    const labwareIsCompatible =
      labwareOnSlot && getLabwareIsCompatible(labwareOnSlot.def, moduleType)

    return !labwareIsCompatible
  }
}
