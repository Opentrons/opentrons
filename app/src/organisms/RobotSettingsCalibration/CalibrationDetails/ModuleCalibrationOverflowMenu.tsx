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
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import { Divider } from '../../../atoms/structure'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { useMenuHandleClickOutside } from '../../../atoms/MenuList/hooks'
import { useRunStatuses } from '../../Devices/hooks'
import { useLatchControls } from '../../ModuleCard/hooks'
import { ModuleWizardFlows } from '../../ModuleWizardFlows'

import type { HeaterShakerDeactivateShakerCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/module'
import type { AttachedModule } from '../../../redux/modules/types'
import type { FormattedPipetteOffsetCalibration } from '../'
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
  const { t } = useTranslation(['device_settings', 'robot_calibration'])

  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  const [showModuleWizard, setShowModuleWizard] = React.useState<boolean>(false)
  const { isRunRunning: isRunning } = useRunStatuses()

  const OverflowMenuRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const { createLiveCommand } = useCreateLiveCommandMutation()

  const requiredAttachOrCalibratePipette =
    formattedPipetteOffsetCalibrations.length === 0 ||
    (formattedPipetteOffsetCalibrations[0].lastCalibrated == null &&
      formattedPipetteOffsetCalibrations[1].lastCalibrated == null)

  const { toggleLatch, isLatchClosed } = useLatchControls(attachedModule)

  const handleCalibration = (): void => {
    if (
      attachedModule.moduleType === HEATERSHAKER_MODULE_TYPE &&
      attachedModule.data.currentSpeed != null &&
      attachedModule.data.currentSpeed > 0
    ) {
      const stopShakeCommand: HeaterShakerDeactivateShakerCreateCommand = {
        commandType: 'heaterShaker/deactivateShaker',
        params: {
          moduleId: module.id,
        },
      }
      createLiveCommand({
        command: stopShakeCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${stopShakeCommand.commandType}: ${e.message}`
        )
      })
    }
    if (!isLatchClosed) {
      toggleLatch()
    }
    setShowOverflowMenu(false)
    setShowModuleWizard(true)
  }

  const handleDeleteCalibration = (): void => {
    // ToDo (kk:08/23/2023)
    // call a custom hook to delete calibration data
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
        />
      ) : null}
      {showOverflowMenu ? (
        <Flex
          ref={OverflowMenuRef}
          whiteSpace="nowrap"
          zIndex="5"
          borderRadius="4px 4px 0px 0px"
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.3rem"
          right="0"
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem
            onClick={handleCalibration}
            disabled={isRunning || requiredAttachOrCalibratePipette}
          >
            {isCalibrated ? t('recalibrate_module') : t('calibrate_module')}
          </MenuItem>
          {isCalibrated ? (
            <>
              <Divider />
              <MenuItem onClick={handleDeleteCalibration} disabled={false}>
                {t('clear_calibration_data')}
              </MenuItem>
            </>
          ) : null}
        </Flex>
      ) : null}
      {menuOverlay}
    </Flex>
  )
}
