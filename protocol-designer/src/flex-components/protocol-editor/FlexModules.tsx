import React, { useState } from 'react'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  FormGroup,
  DropdownField,
  useHoverTooltip,
} from '@opentrons/components'
import { i18n } from '../../localization'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'

import {
  ModuleType,
  ModuleModel,
  OT3_STANDARD_MODEL,
} from '@opentrons/shared-data'
import { ModuleOnDeck } from 'protocol-designer/src/step-forms/types'
import { ModelModuleInfo } from 'protocol-designer/src/components/EditModules'
import { ModuleDiagram } from 'protocol-designer/src/components/modules'
import {
  DEFAULT_MODEL_FOR_MODULE_TYPE,
  MODELS_FOR_FLEX_MODULE_TYPE,
} from '../../constants'
import { MiniCard } from './MiniCard'
import { ConnectedSlotMap } from '../../components/modals/EditModulesModal/ConnectedSlotMap'
import { getAllFlexModuleSlotsByType } from './FlexModuleData'
import { PDAlert } from '../../components/alerts/PDAlert'

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

function FlexModulesComponent({ formProps }: any): JSX.Element {
  const {
    values: { modulesByType },
    handleChange,
    handleBlur,
    setFieldValue,
    touched,
    errors,
  } = formProps
  const modules: ModuleType[] = Object.keys(modulesByType)

  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const toggleModuleSelection = (moduleType: string): void => {
    setSelectedModules([...selectedModules, moduleType])
    if (selectedModules.includes(moduleType)) {
      setSelectedModules(selectedModules.filter(name => name !== moduleType))
      setFieldValue(`modulesByType.${moduleType}.onDeck`, false)
    } else {
      setSelectedModules([...selectedModules, moduleType])
      setFieldValue(`modulesByType.${moduleType}.onDeck`, true)
    }
  }

  const slotIssue =
    errors?.selectedSlot && errors.selectedSlot.includes('occupied')

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })

  return (
    <>
      <StyledText as="h2">
        {i18n.t('flex.modules_selection.heading')}
      </StyledText>

      {slotIssue && (
        <PDAlert
          alertType="warning"
          title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
          description={''}
        />
      )}

      <div className={styles.flex_sub_heading}>
        <>
          {modules.map((moduleType, i) => {
            const label = i18n.t(`modules.module_display_names.${moduleType}`)
            const defaultModel = DEFAULT_MODEL_FOR_MODULE_TYPE[moduleType]
            const selectedModel = modulesByType[moduleType].model
            const moduleTypeAccessor = `modulesByType.${moduleType}`
            return (
              <div className={styles.module_section} key={i}>
                <div className={styles.mini_card}>
                  <div>
                    <MiniCard
                      isSelected={selectedModules.includes(moduleType)}
                      isError={false}
                      value={moduleType}
                      onClick={() => toggleModuleSelection(moduleType)}
                    >
                      <ModuleDiagram
                        type={moduleType}
                        model={selectedModel ?? defaultModel}
                      />
                      <Flex
                        flexDirection={DIRECTION_COLUMN}
                        marginLeft={SPACING.spacing4}
                        marginTop={SPACING.spacing3}
                        marginBottom={SPACING.spacing4}
                      >
                        <StyledText as="h4">{label}</StyledText>
                      </Flex>
                    </MiniCard>
                  </div>
                </div>

                {/* Deck Map Selecetion */}
                {modulesByType[moduleType].onDeck && (
                  <>
                    <FormGroup label="Model" className={styles.module_options}>
                      <DropdownField
                        tabIndex={i}
                        name={`${moduleTypeAccessor}.model`}
                        options={MODELS_FOR_FLEX_MODULE_TYPE[moduleType]}
                        value={selectedModel}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </FormGroup>
                    <div {...targetProps} className={styles.module_options}>
                      <FormGroup label="Position">
                        <DropdownField
                          tabIndex={1}
                          name={`modulesByType.${moduleType}.slot`}
                          options={getAllFlexModuleSlotsByType(moduleType)}
                          value={selectedModel}
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
              </div>
            )
          })}
        </>
      </div>
    </>
  )
}

export const FlexModules = FlexModulesComponent
