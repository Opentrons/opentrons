import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, POSITION_RELATIVE, useHoverTooltip } from '@opentrons/components'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { Tooltip } from '../../../atoms/Tooltip'
import { MenuItemsByModuleType, useModuleOverflowMenu } from './hooks'

import type { AttachedModule } from '../../../redux/modules/types'
import type { ModuleType } from '@opentrons/shared-data'

interface ModuleOverflowMenuProps {
  module: AttachedModule
  handleSlideoutClick: () => void
  handleAboutClick: () => void
  handleTestShakeClick: () => void
  handleWizardClick: () => void
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
                  <>
                    <MenuItem
                      minWidth="10.6rem"
                      key={`${index}_${module.moduleModel}`}
                      onClick={() => item.onClick(item.isSecondary)}
                      data-testid={`module_setting_${module.moduleModel}`}
                      disabled={item.disabledReason}
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
                  </>
                )
              }
            ),
          ]}
        />
      </Flex>
    </>
  )
}
