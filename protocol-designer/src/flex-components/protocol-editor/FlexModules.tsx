import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Flex, DIRECTION_COLUMN, SPACING, Box } from '@opentrons/components'
import { i18n } from '../../localization'
import { StyledText } from './StyledText'
import { css } from 'styled-components'
import { MiniCard } from '../../../../app/src/molecules/MiniCard'
import OT3_PNG from '../../../../app/src/assets/images/OT3.png'
import styles from './FlexComponents.css'

import {
  THERMOCYCLER_MODULE_TYPE,
  ModuleType,
  ModuleModel,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  HEATERSHAKER_MODULE_V1,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_V2,
  SPAN7_8_10_11_SLOT,
} from '@opentrons/shared-data'
import { ModuleOnDeck } from 'protocol-designer/src/step-forms/types'
import { ModelModuleInfo } from 'protocol-designer/src/components/EditModules'
import { selectors as featureFlagSelectors } from 'protocol-designer/src/feature-flags'
import { isModuleWithCollisionIssue } from 'protocol-designer/src/components/modules'
import { FormGroup, Tooltip, useHoverTooltip } from '@opentrons/components'

import { ConnectedSlotMap } from '../../components/modals/EditModulesModal/ConnectedSlotMap'
import { ModelDropdown } from '../../components/modals/EditModulesModal/ModelDropdown'
import { SlotDropdown } from '../../components/modals/EditModulesModal/SlotDropdown'
import { MODELS_FOR_MODULE_TYPE } from '../../constants'
import { getAllModuleSlotsByType } from '../../modules'

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
  const modules = [
    {
      moduleType: HEATERSHAKER_MODULE_TYPE,
      name: 'Heater-Shaker GEN1',
      supportingCopy: 'supporting copy',
      selectedModel: HEATERSHAKER_MODULE_V1,
      selectedSlot: 1,
    },
    {
      moduleType: THERMOCYCLER_MODULE_TYPE,
      name: 'Thermocycler GEN2',
      supportingCopy: 'supporting copy',
      selectedModel: THERMOCYCLER_MODULE_V2,
      selectedSlot: SPAN7_8_10_11_SLOT,
    },
    {
      moduleType: TEMPERATURE_MODULE_TYPE,
      name: 'Temperature GEN2',
      supportingCopy: 'supporting copy',
      selectedModel: TEMPERATURE_MODULE_V2,
      selectedSlot: '3',
    },
    {
      moduleType: MAGNETIC_MODULE_TYPE,
      name: 'Magnetic Block GEN1',
      supportingCopy: 'supporting copy',
      selectedModel: MAGNETIC_MODULE_V1,
      selectedSlot: '9',
    },
    {
      moduleType: 'gripperModuleType',
      name: 'Gripper',
      supportingCopy: '',
      selectedModel: 'gripperModuleV1',
    },
    {
      moduleType: 'trashChuteModuleType',
      name: 'Trash Chute',
      supportingCopy: '',
      selectedModel: 'trashChuteModuleV1',
    },
  ]

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'top',
  })

  const [selectedModules, setSelectedModules] = useState<string[]>([])

  function toggleModuleSelection(moduleName: string): void {
    if (selectedModules.includes(moduleName)) {
      setSelectedModules(selectedModules.filter(name => name !== moduleName))
    } else {
      setSelectedModules([...selectedModules, moduleName])
    }
  }

  const disabledModuleRestriction = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  return (
    <>
      <StyledText as="h2">
        {i18n.t('flex.modules_selection.heading')}
      </StyledText>

      <div className={styles.flex_sub_heading}>
        <>
          {modules.map(
            (
              {
                moduleType,
                name,
                supportingCopy,
                selectedModel,
                selectedSlot,
              }: any,
              index: number
            ) => {
              const isModuleChecked = selectedModules.includes(name)
              const showSlotOption = moduleType !== THERMOCYCLER_MODULE_TYPE
              const showModelOption =
                moduleType !== ('gripperModuleType' || 'trashChuteModuleType')
              const noCollisionIssue =
                selectedModel && !isModuleWithCollisionIssue(selectedModel)
              const slotOptionTooltip = (
                <div className={styles.slot_tooltip}>
                  {i18n.t('tooltip.edit_module_modal.slot_selection')}
                </div>
              )

              const enableSlotSelection =
                disabledModuleRestriction || noCollisionIssue

              return (
                <>
                  <div className={styles.module_section} key={index}>
                    <div className={styles.mini_card}>
                      <MiniCard
                        isSelected={isModuleChecked}
                        isError={false}
                        onClick={() => toggleModuleSelection(name)}
                      >
                        <img
                          src={OT3_PNG}
                          css={css`
                            width: 67px;
                            height: 54px;
                          `}
                        />
                        <Flex
                          flexDirection={DIRECTION_COLUMN}
                          marginLeft={SPACING.spacing4}
                          marginTop={SPACING.spacing3}
                          marginBottom={SPACING.spacing4}
                        >
                          <StyledText as="h4">{name}</StyledText>
                          <Box>
                            <StyledText as="h4">{supportingCopy}</StyledText>
                          </Box>
                        </Flex>
                      </MiniCard>
                    </div>
                    {isModuleChecked && showModelOption && (
                      <>
                        <FormGroup
                          label="Model"
                          className={styles.module_options}
                        >
                          <ModelDropdown
                            fieldName={selectedModel}
                            tabIndex={0}
                            options={MODELS_FOR_MODULE_TYPE[moduleType]}
                          />
                        </FormGroup>
                        {showSlotOption && (
                          <>
                            {!enableSlotSelection && (
                              <Tooltip {...tooltipProps}>
                                {slotOptionTooltip}
                              </Tooltip>
                            )}

                            <div
                              {...targetProps}
                              className={styles.module_options}
                            >
                              <FormGroup label="Position">
                                <SlotDropdown
                                  fieldName={selectedSlot}
                                  options={getAllModuleSlotsByType(moduleType)}
                                  disabled={!enableSlotSelection}
                                  tabIndex={1}
                                />
                              </FormGroup>
                            </div>

                            <ConnectedSlotMap fieldName={selectedSlot} />
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className={styles.line_separator} />
                </>
              )
            }
          )}
        </>
      </div>
    </>
  )
}

export const FlexModules = FlexModulesComponent
