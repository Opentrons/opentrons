// @flow
import * as React from 'react'
import cx from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import { Formik } from 'formik'
import * as Yup from 'yup'
import {
  THERMOCYCLER_MODULE_TYPE,
  type ModuleModel,
  MODULE_MODELS,
} from '@opentrons/shared-data'
import {
  Modal,
  OutlineButton,
  FormGroup,
  DropdownField,
  HoverTooltip,
  SlotMap,
} from '@opentrons/components'
import {
  selectors as stepFormSelectors,
  actions as stepFormActions,
  getSlotIsEmpty,
  getSlotsBlockedBySpanning,
  getLabwareOnSlot,
} from '../../../step-forms'
import { moveDeckItem } from '../../../labware-ingred/actions'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import {
  SUPPORTED_MODULE_SLOTS,
  getAllModuleSlotsByType,
} from '../../../modules'
import { MODELS_FOR_MODULE_TYPE } from '../../../constants'
import { i18n } from '../../../localization'
import { getLabwareIsCompatible } from '../../../utils/labwareModuleCompatibility'
import { PDAlert } from '../../alerts/PDAlert'
import modalStyles from '../modal.css'
import styles from './EditModules.css'
import type { ModuleRealType } from '@opentrons/shared-data'

import { isModuleWithCollisionIssue } from '../../modules'

const validationSchema = Yup.object().shape({
  selectedModel: Yup.string()
    .nullable()
    .required('This field is required'),
  selectedSlot: Yup.string().required(),
})

type EditModulesProps = {
  moduleType: ModuleRealType,
  /** if moduleId is not specified, we're creating a new module of the given type */
  moduleId: ?string,
  onCloseClick: () => mixed,
}

export function EditModulesModal(props: EditModulesProps) {
  const { moduleType, onCloseClick } = props

  const _initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const module = props.moduleId
    ? _initialDeckSetup.modules[props.moduleId]
    : null
  const supportedModuleSlot = SUPPORTED_MODULE_SLOTS[moduleType][0].value

  const initialValues = {
    selectedSlot: module?.slot || supportedModuleSlot,
    selectedModel: module?.model || null,
  }

  const slotsBlockedBySpanning = getSlotsBlockedBySpanning(_initialDeckSetup)
  const previousModuleSlot = module && module.slot

  const showSlotOption = moduleType !== THERMOCYCLER_MODULE_TYPE

  const disabledModuleRestriction = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  const dispatch = useDispatch()

  let onSaveClick = values => {
    const { selectedModel, selectedSlot } = values

    if (module) {
      // disabled if something lives in the slot selected in local state
      // if previous module.model is different, edit module
      if (module.model !== selectedModel) {
        module.id &&
          dispatch(
            stepFormActions.editModule({ id: module.id, model: selectedModel })
          )
      }
      // if previous module.slot is different than state, move deck item
      if (selectedSlot && module.slot !== selectedSlot) {
        module.slot && dispatch(moveDeckItem(module.slot, selectedSlot))
      }
    } else {
      dispatch(
        stepFormActions.createModule({
          slot: selectedSlot,
          type: moduleType,
          model: selectedModel,
        })
      )
    }
    onCloseClick()
  }

  const heading = i18n.t(`modules.module_long_names.${moduleType}`)

  const slotOptionTooltip = (
    <div className={styles.slot_tooltip}>
      {i18n.t('tooltip.edit_module_modal.slot_selection')}
    </div>
  )

  return (
    <Modal
      heading={heading}
      className={cx(modalStyles.modal, styles.edit_module_modal)}
      contentsClassName={styles.modal_contents}
    >
      <Formik
        enableReinitialize
        initialValues={initialValues}
        onSubmit={onSaveClick}
        validationSchema={validationSchema}
      >
        {({
          handleChange,
          handleSubmit,
          errors,
          setFieldValue,
          touched,
          values,
          handleBlur,
          setFieldTouched,
        }) => {
          const { selectedSlot, selectedModel } = values

          const slotIsEmpty =
            !slotsBlockedBySpanning.includes(selectedSlot) &&
            (getSlotIsEmpty(_initialDeckSetup, selectedSlot) ||
              previousModuleSlot === selectedSlot)

          let hasSlotOrIncompatibleError = true
          if (slotIsEmpty) {
            hasSlotOrIncompatibleError = false
          } else {
            const labwareOnSlot = getLabwareOnSlot(
              _initialDeckSetup,
              selectedSlot
            )
            const labwareIsCompatible =
              labwareOnSlot &&
              getLabwareIsCompatible(labwareOnSlot.def, moduleType)

            hasSlotOrIncompatibleError = !labwareIsCompatible
          }
          console.log(touched)
          console.log(errors)
          const occupiedSlotError = hasSlotOrIncompatibleError
            ? `Slot ${selectedSlot} is occupied by another module or by labware incompatible with this module. Remove module or labware from the slot in order to continue.`
            : null

          const moduleHasCollisionIssue =
            selectedModel && !isModuleWithCollisionIssue(selectedModel)
          const enableSlotSelection =
            disabledModuleRestriction || moduleHasCollisionIssue

          function handleModelChange(
            e: SyntheticInputEvent<HTMLSelectElement>
          ) {
            handleChange(e)

            // to handle flow issue with calling isModuleWithCollisionIssue on
            // e.target.value since it is a string at runtime
            let value: ModuleModel | null = null
            const modelValueIndex = MODULE_MODELS.indexOf(e.target.value)
            if (modelValueIndex >= 0) {
              value = MODULE_MODELS[modelValueIndex]
            }
            // reset slot if user switches from module with no collision issue
            // to one that does have collision issues
            if (
              value &&
              (!disabledModuleRestriction && isModuleWithCollisionIssue(value))
            ) {
              setFieldValue('selectedSlot', supportedModuleSlot)
            }
          }

          return (
            <>
              {hasSlotOrIncompatibleError && (
                <PDAlert
                  alertType="warning"
                  title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
                  description={''}
                />
              )}
              <form>
                <div className={styles.form_row}>
                  <FormGroup label="Model*" className={styles.option_model}>
                    <DropdownField
                      tabIndex={0}
                      options={MODELS_FOR_MODULE_TYPE[moduleType]}
                      name="selectedModel"
                      value={selectedModel}
                      onChange={handleModelChange}
                      onBlur={handleBlur}
                      error={
                        touched.selectedModel && errors && errors.selectedModel
                          ? errors.selectedModel
                          : null
                      }
                    />
                  </FormGroup>
                  {showSlotOption && (
                    <>
                      <HoverTooltip
                        placement="top"
                        tooltipComponent={slotOptionTooltip}
                      >
                        {hoverTooltipHandlers => (
                          <div
                            {...hoverTooltipHandlers}
                            className={styles.option_slot}
                          >
                            <FormGroup label="Position">
                              <DropdownField
                                tabIndex={1}
                                options={getAllModuleSlotsByType(moduleType)}
                                name="selectedSlot"
                                value={selectedSlot}
                                disabled={!enableSlotSelection}
                                onChange={handleChange}
                                error={occupiedSlotError}
                              />
                            </FormGroup>
                          </div>
                        )}
                      </HoverTooltip>
                      <div className={styles.slot_map_container}>
                        {selectedSlot && (
                          <SlotMap
                            occupiedSlots={[`${selectedSlot}`]}
                            isError={Boolean(occupiedSlotError)}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className={modalStyles.button_row}>
                  <OutlineButton
                    className={styles.button_margin}
                    onClick={onCloseClick}
                  >
                    {i18n.t('button.cancel')}
                  </OutlineButton>
                  <OutlineButton
                    className={styles.button_margin}
                    disabled={hasSlotOrIncompatibleError}
                    onClick={handleSubmit}
                  >
                    {i18n.t('button.save')}
                  </OutlineButton>
                </div>
              </form>
            </>
          )
        }}
      </Formik>
    </Modal>
  )
}
