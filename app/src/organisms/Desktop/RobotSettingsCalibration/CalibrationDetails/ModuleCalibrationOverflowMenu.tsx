import { useState, useEffect } from 'react'

import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  MenuItem,
  OverflowBtn,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  Tooltip,
  useHoverTooltip,
  useMenuHandleClickOutside,
  useOnClickOutside,
} from '@opentrons/components'

import { useChainLiveCommands, useRunStatuses } from '/app/resources/runs'
import { getModulePrepCommands } from '/app/local-resources/modules'
import { ModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { getModuleTooHot } from '/app/transformations/modules'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'

import type { AttachedModule } from '/app/redux/modules/types'
import type { FormattedPipetteOffsetCalibration } from '..'
interface ModuleCalibrationOverflowMenuProps {
  isCalibrated: boolean
  attachedModule: AttachedModule
  updateRobotStatus: (isRobotBusy: boolean) => void
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
}

export function ModuleCalibrationOverflowMenu({
  isCalibrated,
  attachedModule,
  updateRobotStatus,
  formattedPipetteOffsetCalibrations,
  robotName,
}: ModuleCalibrationOverflowMenuProps): JSX.Element {
  const { t } = useTranslation([
    'device_settings',
    'robot_calibration',
    'module_wizard_flows',
  ])

  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  const [showModuleWizard, setShowModuleWizard] = useState<boolean>(false)
  const { isRunRunning: isRunning } = useRunStatuses()
  const [targetProps, tooltipProps] = useHoverTooltip()

  const OverflowMenuRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })
  const { chainLiveCommands, isCommandMutationLoading } = useChainLiveCommands()

  const requiredAttachOrCalibratePipette =
    formattedPipetteOffsetCalibrations.length === 0 ||
    (formattedPipetteOffsetCalibrations[0].lastCalibrated == null &&
      formattedPipetteOffsetCalibrations[1].lastCalibrated == null)

  const [
    prepCommandErrorMessage,
    setPrepCommandErrorMessage,
  ] = useState<string>('')

  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)

  const handleCalibration = (): void => {
    chainLiveCommands(getModulePrepCommands(attachedModule), false).catch(
      (e: Error) => {
        setPrepCommandErrorMessage(e.message)
      }
    )
    setShowOverflowMenu(false)
    setShowModuleWizard(true)
  }

  useEffect(() => {
    if (isRunning) {
      updateRobotStatus(true)
    }
  }, [isRunning, updateRobotStatus])

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        aria-label="ModuleCalibrationOverflowMenu"
        onClick={handleOverflowClick}
        disabled={isEstopNotDisengaged}
      />
      {showModuleWizard ? (
        <ModuleWizardFlows
          attachedModule={attachedModule}
          closeFlow={() => {
            setShowModuleWizard(false)
          }}
          isPrepCommandLoading={isCommandMutationLoading}
          prepCommandErrorMessage={
            prepCommandErrorMessage === '' ? undefined : prepCommandErrorMessage
          }
        />
      ) : null}
      {showOverflowMenu ? (
        <Flex
          ref={OverflowMenuRef}
          zIndex="5"
          borderRadius="4px 4px 0px 0px"
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.3rem"
          right="0"
          width="max-content"
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem
            onClick={handleCalibration}
            disabled={
              isRunning ||
              requiredAttachOrCalibratePipette ||
              getModuleTooHot(attachedModule)
            }
            {...targetProps}
          >
            {isCalibrated ? t('recalibrate_module') : t('calibrate_module')}
          </MenuItem>
          {requiredAttachOrCalibratePipette ||
          getModuleTooHot(attachedModule) ? (
            <Tooltip tooltipProps={tooltipProps}>
              {t(
                requiredAttachOrCalibratePipette
                  ? 'module_wizard_flows:calibrate_pipette'
                  : 'module_wizard_flows:module_too_hot'
              )}
            </Tooltip>
          ) : null}
        </Flex>
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
