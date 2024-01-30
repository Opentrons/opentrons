import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import some from 'lodash/some'
import {
  Control,
  Controller,
  FormState,
  useController,
  useForm,
  UseFormWatch,
  useWatch,
} from 'react-hook-form'

import {
  FormGroup,
  BUTTON_TYPE_SUBMIT,
  OutlineButton,
  Tooltip,
  useHoverTooltip,
  ModalShell,
  Flex,
  SPACING,
  DIRECTION_ROW,
  Box,
  DeckLocationSelect,
  Text,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
  SlotMap,
  usePrevious,
} from '@opentrons/components'
import {
  getAreSlotsAdjacent,
  THERMOCYCLER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  ModuleType,
  ModuleModel,
  OT2_STANDARD_MODEL,
  THERMOCYCLER_MODULE_V1,
  TEMPERATURE_MODULE_V1,
  RobotType,
  FLEX_ROBOT_TYPE,
  THERMOCYCLER_MODULE_V2,
  OT2_ROBOT_TYPE,
  getDeckDefFromRobotType,
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
import { getRobotType } from '../../../file-data/selectors'
import { PDAlert } from '../../alerts/PDAlert'
import { isModuleWithCollisionIssue } from '../../modules'
import { ModelDropdown } from './ModelDropdown'
import { SlotDropdown } from './SlotDropdown'
import { ConnectedSlotMap } from './ConnectedSlotMap'
import styles from './EditModules.css'

import type { ModuleOnDeck } from '../../../step-forms/types'
import type { ModelModuleInfo } from '../../EditModules'

export interface EditModulesModalProps {
  moduleType: ModuleType
  moduleOnDeck: ModuleOnDeck | null
  onCloseClick: () => void
  editModuleModel: (model: ModuleModel) => void
  editModuleSlot: (slot: string) => void
  displayModuleWarning: (module: ModelModuleInfo) => void
}

type EditModulesModalComponentProps = EditModulesModalProps & {
  supportedModuleSlot: string
  watch: UseFormWatch<EditModulesFormValues>
  formState: FormState<EditModulesFormValues>
  control: Control<EditModulesFormValues, any>
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
  const { t } = useTranslation('alert')
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
    const isSlotEmpty = getSlotIsEmpty(initialDeckSetup, selectedSlot, true)
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

  const validator = (data: EditModulesFormValues): Record<string, any> => {
    const { selectedSlot, selectedModel } = data
    const errors: Record<string, any> = {}
    if (!selectedModel) {
      errors.selectedModel = t('field.required')
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
      errors.selectedSlot = t(
        'module_placement.HEATER_SHAKER_ADJACENT_TO_MODULE.body',
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
        errors.selectedSlot = t(
          'module_placement.HEATER_SHAKER_ADJACENT_TO_ANOTHER_MODULE.body',
          { selectedSlot }
        )
      }
    } else if (
      //  TODO(jr, 8/31/23): this is a bit hacky since the TCGEN2 slot is only B1 instead of B1 and A1
      //  so we have to manually check if slot A1 has issues as well as looking at selectedSlot
      //  this probably deserves a more elegant refactor
      (selectedModel === THERMOCYCLER_MODULE_V2 && hasSlotIssue('A1')) ||
      hasSlotIssue(selectedSlot)
    ) {
      errors.selectedSlot = t('module_placement.SLOT_OCCUPIED.body', {
        selectedSlot,
      })
    } else if (!selectedSlot) {
      // in the event that we remove auto selecting selected slot
      errors.selectedSlot = t('field.required')
    }

    return errors
  }

  const {
    control,
    handleSubmit,
    watch,
    formState,
  } = useForm<EditModulesFormValues>({
    resolver: async data => {
      const validationErrors = validator(data)
      const mappedErrors = Object.keys(validationErrors).reduce((acc, key) => {
        acc[key as keyof typeof validationErrors] = {
          type: 'required',
          message: validationErrors[key],
        }
        return acc
      }, {} as Record<string, any>)
      console.log('mappedErrors', mappedErrors)
      return {
        values: {},
        errors: mappedErrors,
      }
    },
    defaultValues: initialValues,
  })
  console.log('formstate.errors', Object.keys(formState.errors))
  const onSaveClick = (): void => {
    const selectedModel = watch('selectedModel')
    const selectedSlot = watch('selectedSlot')

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
    <form onSubmit={handleSubmit(onSaveClick)}>
      <EditModulesModalComponent
        {...props}
        formState={formState}
        supportedModuleSlot={supportedModuleSlot}
        watch={watch}
        control={control}
      />
    </form>
  )
}

const EditModulesModalComponent = (
  props: EditModulesModalComponentProps
): JSX.Element => {
  const {
    moduleType,
    supportedModuleSlot,
    onCloseClick,
    watch,
    control,
    formState,
  } = props
  const { t } = useTranslation(['tooltip', 'modules', 'alert', 'button'])
  const selectedSlot = watch('selectedSlot')
  const selectedModel = watch('selectedModel')
  const { field } = useController({
    name: 'selectedModel',
    control,
  })
  console.log('field', field)
  const disabledModuleRestriction = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  const robotType = useSelector(getRobotType)
  const flexDeck = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const noCollisionIssue =
    selectedModel && !isModuleWithCollisionIssue(selectedModel)

  const enableSlotSelection = disabledModuleRestriction || noCollisionIssue

  const slotOptionTooltip = (
    <div className={styles.slot_tooltip}>
      {t('edit_module_modal.slot_selection')}
    </div>
  )

  const showSlotOption = moduleType !== THERMOCYCLER_MODULE_TYPE

  // NOTE: selectedSlot error could either be required field (though the field is auto-populated)
  // or occupied slot error. `slotIssue` is only for occupied slot error.
  const slotIssue = 'required' in formState.errors

  const prevSelectedModel = usePrevious(selectedModel)

  React.useEffect(() => {
    if (
      prevSelectedModel &&
      prevSelectedModel !== selectedModel &&
      selectedModel != null &&
      isModuleWithCollisionIssue(selectedModel)
    ) {
      field.onChange({
        selectedModel,
        selectedSlot: supportedModuleSlot,
      })
    }
  })

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })

  //  TODO(jr, 6/26/23): should probably move this into a util component
  function getModuleOptionsForRobotType(
    options: Array<{ name: string; value: ModuleModel }>,
    robotType: RobotType
  ): Array<{ name: string; value: ModuleModel }> {
    const filterOutModels: ModuleModel[] =
      robotType === FLEX_ROBOT_TYPE
        ? [THERMOCYCLER_MODULE_V1, TEMPERATURE_MODULE_V1]
        : []

    const filteredOptions = options.filter(
      option => !filterOutModels.includes(option.value)
    )

    return filteredOptions
  }

  return (
    <ModalShell width="48rem" paddingTop={SPACING.spacing32}>
      <Box paddingX={SPACING.spacing32}>
      <Text as="h2">{t(`modules:module_long_names.${moduleType}`)}</Text>
      </Box>

      <Box paddingX={SPACING.spacing32} paddingTop={SPACING.spacing16}>
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          height="3.125rem"
          alignItems={ALIGN_CENTER}
        >
          <Flex gridGap={SPACING.spacing8}>
            <FormGroup label="Model">
              <Box width="4rem">
                <Controller
                  name="selectedModel"
                  control={control}
                  defaultValue={formState.defaultValues?.selectedModel}
                  render={({ field, fieldState }) => (
                    <ModelDropdown
                      fieldName="selectedModel"
                      tabIndex={0}
                      options={getModuleOptionsForRobotType(
                        MODELS_FOR_MODULE_TYPE[moduleType],
                        robotType
                      )}
                      field={field}
                      fieldState={fieldState}
                    />
                  )}
                />
              </Box>
            </FormGroup>
            {showSlotOption && (
              <>
                {!enableSlotSelection && (
                  <Tooltip {...tooltipProps}>{slotOptionTooltip}</Tooltip>
                )}

                <Box {...targetProps} height="3.125rem">
                  <FormGroup label="Position">
                    <Box
                      width={robotType === FLEX_ROBOT_TYPE ? '8rem' : '18rem'}
                    >
                      <Controller
                        name="selectedSlot"
                        control={control}
                        defaultValue={formState.defaultValues?.selectedSlot}
                        render={({ field, fieldState }) => (
                          <SlotDropdown
                            fieldName="selectedSlot"
                            options={getAllModuleSlotsByType(
                              moduleType,
                              robotType
                            )}
                            disabled={!enableSlotSelection}
                            tabIndex={1}
                            field={field}
                            fieldState={fieldState}
                          />
                        )}
                      />
                    </Box>
                  </FormGroup>
                </Box>
              </>
            )}
          </Flex>
          <Box>
            {slotIssue ? (
              <PDAlert
                alertType="warning"
                title={t('alert:module_placement.SLOT_OCCUPIED.title')}
                description={''}
              />
            ) : null}
          </Box>
        </Flex>

        {robotType === OT2_ROBOT_TYPE ? (
          <Controller
            name="selectedSlot"
            control={control}
            defaultValue={formState.defaultValues?.selectedSlot}
            render={({ field, fieldState }) =>
              moduleType === THERMOCYCLER_MODULE_TYPE ? (
                <Flex
                  height="16rem"
                  justifyContent={JUSTIFY_CENTER}
                  paddingY={SPACING.spacing16}
                >
                  <SlotMap occupiedSlots={['7', '8', '10', '11']} />
                </Flex>
              ) : (
                <ConnectedSlotMap
                  robotType={OT2_ROBOT_TYPE}
                  field={field}
                  hasFieldError={!fieldState.error}
                />
              )
            }
          ></Controller>
        ) : (
          <Flex height="20rem" justifyContent={JUSTIFY_CENTER}>
            <DeckLocationSelect
              deckDef={flexDeck}
              selectedLocation={{ slotName: selectedSlot }}
              theme="grey"
              isThermocycler={moduleType === THERMOCYCLER_MODULE_TYPE}
            />
          </Flex>
        )}
      </Box>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_FLEX_END}
        paddingRight={SPACING.spacing32}
        paddingBottom={SPACING.spacing32}
      >
        <OutlineButton className={styles.button_margin} onClick={onCloseClick}>
        {t('button:cancel')}
        </OutlineButton>
        <OutlineButton
          className={styles.button_margin}
          disabled={!formState.isValid}
          type={BUTTON_TYPE_SUBMIT}
        >
            {t('button:save')}
        </OutlineButton>
      </Flex>
    </ModalShell>
  )
}
