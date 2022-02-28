import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, POSITION_RELATIVE } from '@opentrons/components'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'

import type { AttachedModule } from '../../../redux/modules/types'

interface ModuleOverflowMenuProps {
  module: AttachedModule
  handleClick: (isSecondary: boolean) => void
}

export const ModuleOverflowMenu = (
  props: ModuleOverflowMenuProps
): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const { module, handleClick } = props

  const menuItems = {
    thermocyclerModuleType: [
      {
        setSetting: t('overflow_menu_lid_temp'),
        turnOffSetting: t('overflow_menu_deactivate_block'),
        isSecondary: true,
      },
      {
        setSetting: t('overflow_menu_set_block_temp'),
        turnOffSetting: t('overflow_menu_deactivate_block'),
        isSecondary: false,
      },
    ],
    temperatureModuleType: [
      {
        setSetting: t('overflow_menu_mod_temp'),
        turnOffSetting: t('overflow_menu_deactivate_temp'),
        isSecondary: false,
      },
    ],
    magneticModuleType: [
      {
        setSetting: t('overflow_menu_engage'),
        turnOffSetting: t('overflow_menu_deactivate_temp'),
        isSecondary: false,
      },
    ],
    // TODO(sh, 2022-02-28): add heater shaker menu items
    heaterShakerModuleType: [
      {
        setSetting: 'Start',
        turnOffSetting: 'Deactivate',
        isSecondary: true,
      },
    ],
  }

  const AboutModuleBtn = (
    <MenuItem
      key={`about_module_${module.model}`}
      data-testid={`about_module_${module.model}`}
      //  TODO(jr, 2022-02-17): add about module slideout component when it is created
      onClick={() => console.log('about module overflow menu')}
    >
      {t('overflow_menu_about')}
    </MenuItem>
  )

  return (
    <React.Fragment>
      <Flex position={POSITION_RELATIVE}>
        <MenuList
          buttons={[
            menuItems[module.type].map((item, index) => {
              return (
                <MenuItem
                  minWidth="10rem"
                  key={index}
                  onClick={() => handleClick(item.isSecondary)}
                  data-testid={`module_setting_${module.model}`}
                >
                  {/* TODO(sh, 2022-02-11): conditionally render deactivate setting based on module status and pass the required commands. */}
                  {item.setSetting}
                </MenuItem>
              )
            }),
            AboutModuleBtn,
          ]}
        />
      </Flex>
    </React.Fragment>
  )
}
