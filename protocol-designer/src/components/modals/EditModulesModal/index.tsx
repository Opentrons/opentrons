import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Formik, useFormikContext } from 'formik'
import some from 'lodash/some'
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
  getAreSlotsAdjacent,
  THERMOCYCLER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  ModuleType,
  ModuleModel,
  OT2_STANDARD_MODEL,
} from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import {
  getSlotIdsBlockedBySpanning,
  getSlotIsEmpty,
  getLabwareOnSlot,
} from '../../../step-forms/utils'
import { getLabwareIsCompatible } from '../../../utils/labwareModuleCompatibility'
import {
  selectors as stepFormSelectors,
  actions as stepFormActions,
} from '../../../step-forms'
import {
  SUPPORTED_MODULE_SLOTS_OT2,
  SUPPORTED_MODULE_SLOTS_FLEX,
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

import { ModuleOnDeck } from '../../../step-forms/types'
import { ModelModuleInfo } from '../../EditModules'
import { getRobotType } from '../../../file-data/selectors'

export interface EditModulesModalProps {
  moduleType: ModuleType
  moduleOnDeck: ModuleOnDeck | null
  onCloseClick: () => unknown
  editModuleModel: (model: ModuleModel) => unknown
  editModuleSlot: (slot: string) => unknown
  displayModuleWarning: (module: ModelModuleInfo) => unknown
}

type EditModulesModalComponentProps = EditModulesModalProps & {
  supportedModuleSlot: string
}

export interface EditModulesFormValues {
  selectedModel: ModuleModel | null
  selectedSlot: string
}

export const EditModulesModal = (props: EditModulesModalProps): JSX.Element => {
  const {
    moduleType,
    displayModuleWarning,
    editModuleModel,
    editModuleSlot,
    onCloseClick,
    moduleOnDeck,
  } = props
  const robotType = useSelector(getRobotType)
  const supportedModuleSlot =
    robotType === OT2_STANDARD_MODEL
      ? SUPPORTED_MODULE_SLOTS_OT2[moduleType][0].value
      : SUPPORTED_MODULE_SLOTS_FLEX[moduleType][0].value
  const initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const dispatch = useDispatch()

  const hasSlotIssue = (selectedSlot: string): boolean => {
    const previousModuleSlot = moduleOnDeck?.slot
    const hasModuleMoved = previousModuleSlot !== selectedSlot
    const isSlotBlocked = getSlotIdsBlockedBySpanning(
      initialDeckSetup
    ).includes(selectedSlot)
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
  }: EditModulesFormValues): Record<string, any> => {
    const errors: Record<string, any> = {}
    if (!selectedModel) {
      errors.selectedModel = i18n.t('alert.field.required')
    }
    const isModuleAdjacentToHeaterShaker =
      // if the module is a heater shaker, it can't be adjacent to another heater shaker
      // because PD does not support MoaM
      moduleOnDeck?.type !== HEATERSHAKER_MODULE_TYPE &&
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
      moduleOnDeck?.type === HEATERSHAKER_MODULE_TYPE &&
      !hasSlotIssue(selectedSlot)
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
    } else if (hasSlotIssue(selectedSlot)) {
      errors.selectedSlot = i18n.t(
        'alert.module_placement.SLOT_OCCUPIED.body',
        { selectedSlot }
      )
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

const EditModulesModalComponent = (
  props: EditModulesModalComponentProps
): JSX.Element => {
  const { moduleType, onCloseClick, supportedModuleSlot } = props
  const { values, errors, isValid } = useFormikContext<EditModulesFormValues>()
  const { selectedModel } = values
  const disabledModuleRestriction = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )
  const robotType = useSelector(getRobotType)

  const noCollisionIssue =
    selectedModel && !isModuleWithCollisionIssue(selectedModel)

  const enableSlotSelection = disabledModuleRestriction || noCollisionIssue

  const slotOptionTooltip = (
    <div className={styles.slot_tooltip}>
      {i18n.t('tooltip.edit_module_modal.slot_selection')}
    </div>
  )

  const showSlotOption = moduleType !== THERMOCYCLER_MODULE_TYPE
  // NOTE: selectedSlot error could either be required field (though the field is auto-populated)
  // or occupied slot error. `slotIssue` is only for occupied slot error.
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
            <FormGroup label="Model" className={styles.option_model}>
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
                      fieldName="selectedSlot"
                      options={getAllModuleSlotsByType(moduleType, robotType)}
                      disabled={!enableSlotSelection}
                      tabIndex={1}
                    />
                  </FormGroup>
                </div>

                <ConnectedSlotMap
                  fieldName="selectedSlot"
                  robotType={robotType}
                />
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
