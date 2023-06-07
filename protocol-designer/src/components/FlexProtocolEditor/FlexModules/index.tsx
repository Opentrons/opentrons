import React from 'react'
import {
  DIRECTION_COLUMN,
  DropdownField,
  Flex,
  FormGroup,
  SPACING,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  ModuleModel,
  ModuleType,
  OT3_STANDARD_MODEL,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { useFormikContext } from 'formik'
import { useEffect, useState } from 'react'
import {
  DEFAULT_MODEL_FOR_MODULE_TYPE,
  MODELS_FOR_MODULE_TYPE,
} from '../../../constants'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { i18n } from '../../../localization'
import { ModuleOnDeck } from '../../../step-forms'
import { ModelModuleInfo } from '../../EditModules'
import { PDAlert } from '../../alerts/PDAlert'
import { ConnectedSlotMap } from '../../modals/EditModulesModal/ConnectedSlotMap'
import styles from '../FlexComponents.css'
import { StyledText } from '../StyledText'
import { getAllFlexModuleSlotsByType } from './FlexModuleData'
import { FlexSupportedModuleDiagram } from './FlexModuleDiagram'
import { MiniCard } from './MiniCard'
import { validator } from './validator'

import { useSelector } from 'react-redux'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { isModuleWithCollisionIssue } from '../../modules'

export interface EditModulesModalProps {
  moduleType: ModuleType
  moduleOnDeck: ModuleOnDeck | null
  onCloseClick: () => unknown
  editModuleModel: (model: ModuleModel) => unknown
  editModuleSlot: (slot: string) => unknown
  displayModuleWarning: (module: ModelModuleInfo) => unknown
}

export interface EditModulesFormValues {
  selectedModel: ModuleModel | null
  selectedSlot: string
}

interface FormValues {
  modulesByType: any
  selectedSlot: string
}

interface SupportedSlots {
  [key: string]: string
}

function FlexModulesComponent(): JSX.Element {
  const {
    values: { modulesByType },
    handleChange,
    handleBlur,
    setFieldValue,
  } = useFormikContext<FormValues>()
  // @ts-expect-error(sa, 2021-6-21): Object.keys not smart enough to take the keys of FormModulesByType
  const modules: ModuleType[] = Object.keys(modulesByType)
  const initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)
  const supportedSlots: SupportedSlots = {
    [MAGNETIC_MODULE_TYPE]: 'GEN1',
    [TEMPERATURE_MODULE_TYPE]: 'GEN2',
    [THERMOCYCLER_MODULE_TYPE]: 'GEN2',
    [HEATERSHAKER_MODULE_TYPE]: 'GEN1',
    [MAGNETIC_BLOCK_TYPE]: 'GEN1',
  }

  const [selectedModules, setSelectedModules] = useState<string[]>(
    Object.keys(modulesByType).filter(j => modulesByType[j].onDeck)
  )
  const [errors, setError] = useState<Record<string, any>>({})

  const disabledModuleRestriction = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  let enableSlotSelection = false
  const toggleModuleSelection = (moduleType: string): void => {
    const noCollisionIssue = !isModuleWithCollisionIssue(moduleType)
    enableSlotSelection = disabledModuleRestriction || noCollisionIssue
    setSelectedModules([...selectedModules, moduleType])
    if (selectedModules.includes(moduleType)) {
      setSelectedModules(
        selectedModules.filter((name: string) => name !== moduleType)
      )
      setFieldValue(`modulesByType.${moduleType}.onDeck`, false)
    } else {
      setSelectedModules([...selectedModules, moduleType])
      setFieldValue(`modulesByType.${moduleType}.onDeck`, true)
    }
  }

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })

  const slotOptionTooltip = (
    <div className={styles.slot_tooltip}>
      {i18n.t('tooltip.edit_module_modal.slot_selection')}
    </div>
  )

  useEffect(() => {
    for (let key in modulesByType) {
      if (modulesByType.hasOwnProperty(key) && modulesByType[key].onDeck) {
        const error = validator({
          selectedModel: modulesByType[key],
          selectedType: key,
          initialDeckSetup,
        })
        error && setError(error)
      }
    }
  }, modulesByType)

  const slotIssue =
    errors?.selectedSlot && errors?.selectedSlot.includes('occupied')

  return (
    <>
      <StyledText as="h2">
        {i18n.t('flex.modules_selection.heading')}
      </StyledText>

      {slotIssue && (
        <PDAlert
          alertType="warning"
          title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
          description={errors.selectedSlot}
        />
      )}

      <div className={styles.flex_sub_heading}>
        <>
          {modules.map((moduleType, i) => {
            const showSlotOption = moduleType !== THERMOCYCLER_MODULE_TYPE
            const label = i18n.t(`modules.module_display_names.${moduleType}`)
            const defaultModel = DEFAULT_MODEL_FOR_MODULE_TYPE[moduleType]
            const selectedModel = modulesByType[moduleType].model
            const moduleTypeAccessor = `modulesByType.${moduleType}`
            return (
              <div className={styles.module_section} key={i}>
                <div className={styles.mini_card}>
                  <MiniCard
                    isSelected={selectedModules.includes(moduleType)}
                    isError={false}
                    value={moduleType}
                    onClick={() => toggleModuleSelection(moduleType)}
                  >
                    <FlexSupportedModuleDiagram
                      type={moduleType}
                      model={selectedModel ?? defaultModel}
                    />
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      marginLeft={SPACING.spacing4}
                      marginTop={SPACING.spacing4}
                      marginBottom={SPACING.spacing4}
                    >
                      <StyledText as="h4">{label}</StyledText>
                    </Flex>
                  </MiniCard>
                </div>

                {/* Deck Map Selecetion */}
                {modulesByType[moduleType].onDeck && (
                  <>
                    <FormGroup label="Model" className={styles.model_options}>
                      <DropdownField
                        tabIndex={i}
                        name={`${moduleTypeAccessor}.model`}
                        options={MODELS_FOR_MODULE_TYPE[moduleType].filter(
                          ({ name }) => name === supportedSlots[moduleType]
                        )}
                        value={selectedModel}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </FormGroup>

                    {showSlotOption && (
                      <>
                        {!enableSlotSelection && (
                          <Tooltip {...tooltipProps}>
                            {slotOptionTooltip}
                          </Tooltip>
                        )}
                        <div {...targetProps}>
                          <FormGroup
                            label="Position"
                            className={styles.model_options}
                          >
                            <DropdownField
                              tabIndex={1}
                              name={`modulesByType.${moduleType}.slot`}
                              options={getAllFlexModuleSlotsByType(moduleType)}
                              value={modulesByType[moduleType].slot}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </FormGroup>
                        </div>
                        <ConnectedSlotMap
                          fieldName={`modulesByType.${moduleType}.slot`}
                          robotType={OT3_STANDARD_MODEL}
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </>
      </div>
    </>
  )
}

export const FlexModules = FlexModulesComponent
