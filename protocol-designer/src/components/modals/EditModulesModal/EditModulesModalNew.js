// @flow
import React from 'react'
import { useSelector } from 'react-redux'
import { Formik } from 'formik'
import cx from 'classnames'
import { i18n } from '../../../localization'
import {
  getSlotsBlockedBySpanning,
  getSlotIsEmpty,
  getLabwareOnSlot,
} from '../../../step-forms/utils'
import { getLabwareIsCompatible } from '../../../utils/labwareModuleCompatibility'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { PDAlert } from '../../alerts/PDAlert'
import type { ModuleRealType } from '@opentrons/shared-data'
import modalStyles from '../modal.css'
import styles from './EditModules.css'
import { ModelDropdown } from './ModelDropdown'
import { SUPPORTED_MODULE_SLOTS } from '../../../modules/moduleData'
import { Modal } from '@opentrons/components'
import type { FormikProps } from 'formik/@flow-typed'

type EditModulesModalProps = {
  moduleType: ModuleRealType,
  moduleId: ?string,
  onCloseClick: () => mixed,
}

export type EditModulesFormValues = {
  selectedModel: ModuleModel | null,
  selectedSlot: string,
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
    <Modal
      heading={i18n.t(`modules.module_long_names.${moduleType}`)}
      className={cx(modalStyles.modal, styles.edit_module_modal)}
      contentsClassName={styles.modal_contents}
    >
      <Formik onSubmit={() => null} initialValues={initialValues}>
        {({ values, handleChange }: FormikProps<EditModulesFormValues>) => {
          const { selectedSlot, selectedModel } = values
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
              <form>
                <div className={styles.form_row}>
                  <ModelDropdown
                    moduleType={moduleType}
                    selectedModel={selectedModel}
                  />
                </div>
              </form>
              {/* <SlotDropdown /> */}
              {/* <SlotMap /> */}
              {/* <Buttons />  use type=[submit] here rather than passing down submit handler */}
            </>
          )
        }}
      </Formik>
    </Modal>
  )
}
//  WHY does this work? shouldn't this not get hoisted since its a function expression???
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
