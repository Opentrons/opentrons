import * as React from 'react'
import { Flex, POSITION_RELATIVE } from '@opentrons/components'
import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { useRunStatuses, useIsLegacySessionInProgress } from '../Devices/hooks'
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
  const {
    module,
    runId,
    handleSlideoutClick,
    handleAboutClick,
    handleTestShakeClick,
    handleWizardClick,
    isLoadedInRun,
  } = props
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
  const { isRunTerminal, isRunStill } = useRunStatuses()
  const isLegacySessionInProgress = useIsLegacySessionInProgress()

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
                    disabled={isDisabled}
                  >
                    {item.setSetting}
                  </MenuItem>
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
