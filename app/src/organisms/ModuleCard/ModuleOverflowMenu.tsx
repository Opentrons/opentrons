import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, POSITION_RELATIVE } from '@opentrons/components'

import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useFeatureFlag } from '../../redux/config'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import {
  useIsOT3,
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
  } = props

  const { t } = useTranslation('module_wizard_flows')

  const currentRunId = useCurrentRunId()
  const { isRunTerminal, isRunStill } = useRunStatuses()
  const isLegacySessionInProgress = useIsLegacySessionInProgress()
  const isOT3 = useIsOT3(robotName)
  const isIncompatibleWithOT3 =
    isOT3 && module.moduleModel === 'thermocyclerModuleV1'

  const enableModuleCalibration = useFeatureFlag('enableModuleCalibration')

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
        {enableModuleCalibration ? (
          <MenuItem onClick={handleCalibrateClick}>{t('calibrate')}</MenuItem>
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
