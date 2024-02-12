import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, POSITION_RELATIVE, useHoverTooltip } from '@opentrons/components'

import { MODULE_MODELS_OT2_ONLY } from '@opentrons/shared-data'
import { MenuList } from '../../atoms/MenuList'
import { Tooltip } from '../../atoms/Tooltip'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import {
  useIsFlex,
  useRunStatuses,
  useIsLegacySessionInProgress,
} from '../Devices/hooks'
import { useModuleOverflowMenu } from './hooks'

import type { AttachedModule } from '../../redux/modules/types'

interface ModuleOverflowMenuProps {
  module: AttachedModule
  handleSlideoutClick: () => void
  handleAboutClick: () => void
  handleTestShakeClick: () => void
  handleInstructionsClick: () => void
  handleCalibrateClick: () => void
  isLoadedInRun: boolean
  isPipetteReady: boolean
  isTooHot: boolean
  robotName: string
  runId?: string
}

export const ModuleOverflowMenu = (
  props: ModuleOverflowMenuProps
): JSX.Element | null => {
  const {
    module,
    robotName,
    runId,
    handleSlideoutClick,
    handleAboutClick,
    handleTestShakeClick,
    handleInstructionsClick,
    handleCalibrateClick,
    isLoadedInRun,
    isPipetteReady,
    isTooHot,
  } = props

  const { t, i18n } = useTranslation('module_wizard_flows')

  const currentRunId = useCurrentRunId()
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { isRunTerminal, isRunStill } = useRunStatuses()
  const isLegacySessionInProgress = useIsLegacySessionInProgress()
  const isFlex = useIsFlex(robotName)
  const isIncompatibleWithOT3 =
    isFlex && module.moduleModel === 'thermocyclerModuleV1'

  let isDisabled: boolean = false
  if (runId != null && isLoadedInRun) {
    isDisabled = !isRunStill
  } else if ((runId != null || currentRunId != null) && !isLoadedInRun) {
    isDisabled = !isRunTerminal && !isLegacySessionInProgress
  }

  if (isIncompatibleWithOT3) {
    isDisabled = true
  }

  const { menuOverflowItemsByModuleType } = useModuleOverflowMenu(
    module,
    handleAboutClick,
    handleTestShakeClick,
    handleInstructionsClick,
    handleSlideoutClick,
    isDisabled,
    isIncompatibleWithOT3
  )

  return (
    <Flex position={POSITION_RELATIVE}>
      <MenuList>
        {isFlex &&
        !MODULE_MODELS_OT2_ONLY.some(
          modModel => modModel === module.moduleModel
        ) ? (
          <>
            <MenuItem
              onClick={handleCalibrateClick}
              disabled={!isPipetteReady || isTooHot}
              {...targetProps}
            >
              {i18n.format(
                module.moduleOffset?.last_modified != null
                  ? t('recalibrate')
                  : t('calibrate'),
                'capitalize'
              )}
            </MenuItem>
            {!isPipetteReady || isTooHot ? (
              <Tooltip tooltipProps={tooltipProps}>
                {t(!isPipetteReady ? 'calibrate_pipette' : 'module_too_hot')}
              </Tooltip>
            ) : null}
          </>
        ) : null}
        {menuOverflowItemsByModuleType[module.moduleType].map(
          (item: any, index: number) => {
            return (
              <React.Fragment key={`${index}_${String(module.moduleType)}`}>
                <MenuItem
                  onClick={() => item.onClick(item.isSecondary)}
                  disabled={item.disabledReason || isDisabled}
                  whiteSpace="nowrap"
                >
                  {item.setSetting}
                </MenuItem>
                {item.menuButtons}
              </React.Fragment>
            )
          }
        )}
      </MenuList>
    </Flex>
  )
}
