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

import { handleModuleWizardFlows } from '/app/organisms/ModuleWizardFlows'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { getModuleTooHot } from '/app/transformations/modules'

import type { AttachedModule } from '/app/redux/modules/types'
import type { FormattedPipetteOffsetCalibration } from '..'

interface ModuleCalibrationOverflowMenuProps {
  isCalibrated: boolean
  isRobotBusy: boolean
  attachedModule: AttachedModule
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  robotName: string
}

export function ModuleCalibrationOverflowMenu({
  isCalibrated,
  isRobotBusy,
  attachedModule,
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

  const [targetProps, tooltipProps] = useHoverTooltip()

  const OverflowMenuRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      setShowOverflowMenu(false)
    },
  })

  const requiredAttachOrCalibratePipette =
    formattedPipetteOffsetCalibrations.length === 0 ||
    (formattedPipetteOffsetCalibrations[0].lastCalibrated == null &&
      formattedPipetteOffsetCalibrations[1].lastCalibrated == null)

  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)

  const handleCalibration = (): void => {
    handleModuleWizardFlows({
      attachedModule,
      robotName,
    })
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn
        alignSelf={ALIGN_FLEX_END}
        aria-label="ModuleCalibrationOverflowMenu"
        onClick={handleOverflowClick}
        disabled={isEstopNotDisengaged}
      />
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
              isRobotBusy ||
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
