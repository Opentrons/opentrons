// @flow
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Formik, useFormikContext } from 'formik'
import cx from 'classnames'
import {
  Modal,
  FormGroup,
  BUTTON_TYPE_SUBMIT,
  OutlineButton,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import {
  THERMOCYCLER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
} from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import {
  getSlotsBlockedBySpanning,
  getSlotIsEmpty,
  getLabwareOnSlot,
} from '../../../step-forms/utils'
import { getLabwareIsCompatible } from '../../../utils/labwareModuleCompatibility'
import {
  selectors as stepFormSelectors,
  actions as stepFormActions,
} from '../../../step-forms'
import {
  SUPPORTED_MODULE_SLOTS,
  getAllModuleSlotsByType,
} from '../../../modules/moduleData'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { MODELS_FOR_MODULE_TYPE } from '../../../constants'
import { PDAlert } from '../../alerts/PDAlert'
import { isModuleWithCollisionIssue } from '../../modules'
import modalStyles from '../modal.css'
import styles from './EditModules.css'
import { ModelDropdown } from './ModelDropdown'
import { SlotDropdown } from './SlotDropdown'
import { ConnectedSlotMap } from './ConnectedSlotMap'
import { useResetSlotOnModelChange } from './form-state'

import type { ModuleRealType, ModuleModel } from '@opentrons/shared-data'
import type { ModuleOnDeck } from '../../../step-forms/types'
import type { ModelModuleInfo } from '../../EditModules'

type EditModulesModalProps = {|
  moduleType: ModuleRealType,
  moduleOnDeck: ModuleOnDeck | null,
  onCloseClick: () => mixed,
  editModuleModel: (model: ModuleModel) => mixed,
  editModuleSlot: (slot: string) => mixed,
  displayModuleWarning: (module: ModelModuleInfo) => mixed,
|}

type EditModulesModalComponentProps = {|
  ...EditModulesModalProps,
  supportedModuleSlot: string,
|}

export type EditModulesFormValues = {|
  selectedModel: ModuleModel | null,
  selectedSlot: string,
|}

export const EditModulesModal = (props: EditModulesModalProps) => {
  const {
    moduleType,
    displayModuleWarning,
    editModuleModel,
    editModuleSlot,
    onCloseClick,
    moduleOnDeck,
  } = props
  const supportedModuleSlot = SUPPORTED_MODULE_SLOTS[moduleType][0].value
  const initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const dispatch = useDispatch()

  const hasSlotIssue = (selectedSlot): boolean => {
    const previousModuleSlot = moduleOnDeck?.slot
    const hasModuleMoved = previousModuleSlot !== selectedSlot
    const isSlotBlocked = getSlotsBlockedBySpanning(initialDeckSetup).includes(
      selectedSlot
    )
    const isSlotEmpty = getSlotIsEmpty(initialDeckSetup, selectedSlot)
    const labwareOnSlot = getLabwareOnSlot(initialDeckSetup, selectedSlot)
    const isLabwareCompatible =
      labwareOnSlot && getLabwareIsCompatible(labwareOnSlot.def, moduleType)

    if (!hasModuleMoved || (isSlotEmpty && !isSlotBlocked)) {
      return false
    }

    return !isLabwareCompatible
  }

  const initialValues = {
    selectedSlot: moduleOnDeck?.slot || supportedModuleSlot,
    selectedModel: moduleOnDeck?.model || null,
  }

  const validator = ({
    selectedModel,
    selectedSlot,
  }: EditModulesFormValues) => {
    const errors = {}
    if (!selectedModel) {
      errors.selectedModel = i18n.t('alert.field.required')
    }

    if (hasSlotIssue(selectedSlot)) {
      errors.selectedSlot = `Slot ${selectedSlot} is occupied by another module or by labware incompatible with this module. Remove module or labware from the slot in order to continue.`
    } else if (!selectedSlot) {
      // in the event that we remove auto selecting selected slot
      errors.selectedSlot = i18n.t('alert.field.required')
    }

    return errors
  }

  const onSaveClick = (values: EditModulesFormValues): void => {
    const { selectedModel, selectedSlot } = values
    // validator from formik should never let onSaveClick be called
    // this case might never be true but still need to handle for flow
    if (!selectedModel) {
      console.warn(
        'Cannot edit module without a module on the deck. This should not happen'
      )
      return
    }

    if (moduleOnDeck) {
      // disabled if something lives in the slot selected in local state
      // if previous moduleOnDeck.model is different, edit module
      if (moduleOnDeck.model !== selectedModel) {
        if (moduleOnDeck.type === MAGNETIC_MODULE_TYPE) {
          // we're changing Magnetic Module's model, show the blocking hint modal
          displayModuleWarning({
            model: selectedModel,
            slot: selectedSlot,
          })
          // bail out of the rest of the submit (avoid onCloseClick call)
          return
        } else {
          editModuleModel(selectedModel)
        }
      }
      editModuleSlot(selectedSlot)
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

  return (
    <Formik
      onSubmit={onSaveClick}
      initialValues={initialValues}
      initialErrors={validator(initialValues)}
      validate={validator}
    >
      <EditModulesModalComponent
        {...props}
        supportedModuleSlot={supportedModuleSlot}
      />
    </Formik>
  )
}

const EditModulesModalComponent = (props: EditModulesModalComponentProps) => {
  const { moduleType, onCloseClick, supportedModuleSlot } = props
  const { values, errors, isValid } = useFormikContext()
  const { selectedModel } = values

  const disabledModuleRestriction = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  const noCollisionIssue =
    selectedModel && !isModuleWithCollisionIssue(selectedModel)

  const enableSlotSelection = disabledModuleRestriction || noCollisionIssue

  const slotOptionTooltip = (
    <div className={styles.slot_tooltip}>
      {i18n.t('tooltip.edit_module_modal.slot_selection')}
    </div>
  )

  const showSlotOption = moduleType !== THERMOCYCLER_MODULE_TYPE
  const slotIssue =
    errors?.selectedSlot && errors.selectedSlot.includes('occupied')

  useResetSlotOnModelChange(supportedModuleSlot)

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })

  return (
    <Modal
      heading={i18n.t(`modules.module_long_names.${moduleType}`)}
      className={cx(modalStyles.modal, styles.edit_module_modal)}
      contentsClassName={styles.modal_contents}
    >
      <>
        {slotIssue && (
          <PDAlert
            alertType="warning"
            title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
            description={''}
          />
        )}
        <Form>
          <div className={styles.form_row}>
            <FormGroup label="Model*" className={styles.option_model}>
              <ModelDropdown
                fieldName={'selectedModel'}
                tabIndex={0}
                options={MODELS_FOR_MODULE_TYPE[moduleType]}
              />
            </FormGroup>
            {showSlotOption && (
              <>
                {!enableSlotSelection && (
                  <Tooltip {...tooltipProps}>{slotOptionTooltip}</Tooltip>
                )}

                <div {...targetProps} className={styles.option_slot}>
                  <FormGroup label="Position">
                    <SlotDropdown
                      fieldName={'selectedSlot'}
                      options={getAllModuleSlotsByType(moduleType)}
                      disabled={!enableSlotSelection}
                      tabIndex={1}
                    />
                  </FormGroup>
                </div>

                <ConnectedSlotMap fieldName={'selectedSlot'} />
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
              disabled={!isValid}
              type={BUTTON_TYPE_SUBMIT}
            >
              {i18n.t('button.save')}
            </OutlineButton>
          </div>
        </Form>
      </>
    </Modal>
  )
}
