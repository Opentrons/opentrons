import React, { useState } from 'react'
import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'
import { i18n } from '../../localization'
import { StyledText } from './StyledText'
import styles from './FlexComponents.css'

import { ModuleType, ModuleModel } from '@opentrons/shared-data'
import { ModuleOnDeck } from 'protocol-designer/src/step-forms/types'
import { ModelModuleInfo } from 'protocol-designer/src/components/EditModules'
import { ModuleDiagram } from 'protocol-designer/src/components/modules'
import { DEFAULT_MODEL_FOR_MODULE_TYPE } from '../../constants'
import { MiniCard } from './MiniCard'

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
  } = formProps
  const modules: ModuleType[] = Object.keys(modulesByType)

  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const toggleModuleSelection = (label: string): void => {
    setSelectedModules([...selectedModules, label])
    if (selectedModules.includes(label)) {
      setSelectedModules(selectedModules.filter(name => name !== label))
    } else {
      setSelectedModules([...selectedModules, label])
    }
  }

  console.log('selectedModulesselectedModules', selectedModules)
  return (
    <>
      <StyledText as="h2">
        {i18n.t('flex.modules_selection.heading')}
      </StyledText>

      <div className={styles.flex_sub_heading}>
        <>
          {modules.map((moduleType, i) => {
            const label = i18n.t(`modules.module_display_names.${moduleType}`)
            const defaultModel = DEFAULT_MODEL_FOR_MODULE_TYPE[moduleType]
            const selectedModel = modulesByType[moduleType].model
            return (
              <div className={styles.module_section} key={i}>
                <div className={styles.mini_card}>
                  <MiniCard
                    isSelected={selectedModules.includes(label)}
                    isError={false}
                    value={label}
                    onClick={() => toggleModuleSelection(label)}
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
            )
          })}
        </>
      </div>
    </>
  )
}

export const FlexModules = FlexModulesComponent
