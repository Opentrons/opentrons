import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  POSITION_RELATIVE,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { useModuleOverflowMenu } from './hooks'

import type { AttachedModule } from '../../../redux/modules/types'

interface ModuleOverflowMenuProps {
  module: AttachedModule
  handleClick: () => void
  handleAboutClick: () => void
  handleTestShakeClick: () => void
  handleWizardClick: () => void
}

export const ModuleOverflowMenu = (
  props: ModuleOverflowMenuProps
): JSX.Element | null => {
  const { t } = useTranslation(['device_details', 'heater_shaker'])
  const {
    module,
    handleClick,
    handleAboutClick,
    handleTestShakeClick,
    handleWizardClick,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { menuOverflowItemsByModuleType } = useModuleOverflowMenu(
    module,
    handleAboutClick,
    handleTestShakeClick,
    handleWizardClick,
    handleClick
  )

  return (
    <>
      <Flex position={POSITION_RELATIVE}>
        <MenuList
          buttons={[
            menuOverflowItemsByModuleType[module.type].map((item, index) => {
              return (
                <>
                  <MenuItem
                    minWidth="10rem"
                    key={`${index}_${module.model}`}
                    onClick={() => item.onClick(item.isSecondary)}
                    data-testid={`module_setting_${module.model}`}
                    disabled={item.disabledReason}
                    {...targetProps}
                  >
                    {item.setSetting}
                  </MenuItem>
                  {item.disabledReason && (
                    <Tooltip
                      {...tooltipProps}
                      key={`tooltip_${index}_${module.model}`}
                    >
                      {t('cannot_shake', { ns: 'heater_shaker' })}
                    </Tooltip>
                  )}
                  {item.menuButtons}
                </>
              )
            }),
          ]}
        />
      </Flex>
    </>
  )
}
