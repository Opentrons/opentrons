import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { Flex, POSITION_RELATIVE, useHoverTooltip } from '@opentrons/components'
import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Tooltip } from '../../atoms/Tooltip'
import { useRunStatus } from '../RunTimeControl/hooks'
import { useRunIncompleteOrLegacySessionInProgress } from '../Devices/hooks'
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
  isModuleControl: boolean
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
    isModuleControl,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { menuOverflowItemsByModuleType } = useModuleOverflowMenu(
    module,
    runId,
    handleAboutClick,
    handleTestShakeClick,
    handleWizardClick,
    handleSlideoutClick
  )
  const isIncompleteOrBusy = useRunIncompleteOrLegacySessionInProgress()
  const runStatus = useRunStatus(runId != null ? runId : null)
  const isRunStill =
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED ||
    runStatus === RUN_STATUS_IDLE

  let isDisabled: boolean = false
  if (runId != null && isModuleControl) {
    isDisabled = !isRunStill
  } else if (runId != null && !isModuleControl) {
    isDisabled = isIncompleteOrBusy
  }

  return (
    <>
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
                      minWidth="10.6rem"
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
                        {t('cannot_shake', { ns: 'heater_shaker' })}
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
    </>
  )
}
