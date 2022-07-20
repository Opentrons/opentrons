import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, POSITION_RELATIVE, useHoverTooltip } from '@opentrons/components'
import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Tooltip } from '../../atoms/Tooltip'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { useRunStatuses } from '../Devices/hooks'
import { useModuleOverflowMenu } from './hooks'

import type { AttachedModule } from '../../redux/modules/types'
import type { ModuleType } from '@opentrons/shared-data'
import type { MenuItemsByModuleType } from './hooks'

interface ModuleOverflowMenuProps {
  module: AttachedModule
  handleSlideoutClick: () => void
  handleAboutClick: () => void
  handleTestShakeClick: () => void
  handleWizardClick: () => void
  isLoadedInRun: boolean
  runId?: string
}

export const ModuleOverflowMenu = (
  props: ModuleOverflowMenuProps
): JSX.Element | null => {
  const { t } = useTranslation(['device_details', 'heater_shaker'])
  const {
    module,
    runId,
    handleSlideoutClick,
    handleAboutClick,
    handleTestShakeClick,
    handleWizardClick,
    isLoadedInRun,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { menuOverflowItemsByModuleType } = useModuleOverflowMenu(
    module,
    runId,
    handleAboutClick,
    handleTestShakeClick,
    handleWizardClick,
    handleSlideoutClick,
    isLoadedInRun
  )
  const currentRunId = useCurrentRunId()
  const {
    isRunTerminal,
    isLegacySessionInProgress,
    isRunStill,
  } = useRunStatuses()

  let isDisabled: boolean = false
  if (runId != null && isLoadedInRun) {
    isDisabled = !isRunStill
  } else if ((runId != null || currentRunId != null) && !isLoadedInRun) {
    isDisabled = !isRunTerminal && !isLegacySessionInProgress
  }

  return (
    <Flex position={POSITION_RELATIVE}>
      <MenuList
        buttons={[
          (menuOverflowItemsByModuleType[
            module.moduleType
          ] as MenuItemsByModuleType[ModuleType]).map(
            (item: any, index: number) => {
              return (
                <React.Fragment key={`${index}_${module.moduleType}`}>
                  <MenuItem
                    key={`${index}_${module.moduleModel}`}
                    onClick={() => item.onClick(item.isSecondary)}
                    data-testid={`module_setting_${module.moduleModel}`}
                    disabled={item.disabledReason || isDisabled}
                    {...targetProps}
                  >
                    {item.setSetting}
                  </MenuItem>
                  {item.disabledReason && (
                    <Tooltip tooltipProps={tooltipProps}>
                      {t('heater_shaker:cannot_shake')}
                    </Tooltip>
                  )}
                  {item.menuButtons}
                </React.Fragment>
              )
            }
          ),
        ]}
      />
    </Flex>
  )
}
