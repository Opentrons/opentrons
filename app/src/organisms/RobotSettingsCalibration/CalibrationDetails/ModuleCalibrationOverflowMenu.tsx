import * as React from 'react'

import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  POSITION_ABSOLUTE,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  useOnClickOutside,
  useHoverTooltip,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'

import { Tooltip } from '../../../atoms/Tooltip'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { useMenuHandleClickOutside } from '../../../atoms/MenuList/hooks'
import { useRunStatuses } from '../../Devices/hooks'
import { ModuleWizardFlows } from '../../ModuleWizardFlows'
import { emitPrepCommandsForModuleCalibration } from '../../Devices/emitPrepCommandsForModuleCalibration'
import { getModuleTooHot } from '../../Devices/getModuleTooHot'

import type { AttachedModule } from '../../../redux/modules/types'
import type { FormattedPipetteOffsetCalibration } from '..'
interface ModuleCalibrationOverflowMenuProps {
  isCalibrated: boolean
  attachedModule: AttachedModule
  updateRobotStatus: (isRobotBusy: boolean) => void
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
}

export function ModuleCalibrationOverflowMenu({
  isCalibrated,
  attachedModule,
  updateRobotStatus,
  formattedPipetteOffsetCalibrations,
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

  const [showModuleWizard, setShowModuleWizard] = React.useState<boolean>(false)
  const { isRunRunning: isRunning } = useRunStatuses()
  const [targetProps, tooltipProps] = useHoverTooltip()

  const OverflowMenuRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const { createLiveCommand } = useCreateLiveCommandMutation()

  const requiredAttachOrCalibratePipette =
    formattedPipetteOffsetCalibrations.length === 0 ||
    (formattedPipetteOffsetCalibrations[0].lastCalibrated == null &&
      formattedPipetteOffsetCalibrations[1].lastCalibrated == null)

  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [
    prepCommandErrorMessage,
    setPrepCommandErrorMessage,
  ] = React.useState<string>('')

  //  awaiting each promise to make sure the server receives requests in the right order in case
  //  there are multiple commands that need to be emitted
  const handleCalibration = async (): Promise<void> => {
    await emitPrepCommandsForModuleCalibration(
      setPrepCommandErrorMessage,
      setIsLoading,
      attachedModule,
      createLiveCommand
    )
    setShowOverflowMenu(false)
    setShowModuleWizard(true)
  }

  React.useEffect(() => {
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
      />
      {showModuleWizard ? (
        <ModuleWizardFlows
          attachedModule={attachedModule}
          closeFlow={() => {
            setShowModuleWizard(false)
          }}
          isPrepCommandLoading={isLoading}
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
