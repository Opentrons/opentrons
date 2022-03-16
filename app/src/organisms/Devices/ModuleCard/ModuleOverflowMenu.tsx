import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, POSITION_RELATIVE } from '@opentrons/components'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'

import type { AttachedModule } from '../../../redux/modules/types'
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

interface ModuleOverflowMenuProps {
  module: AttachedModule
  handleClick: (isSecondary: boolean) => void
  handleAboutClick: () => void
}

export const ModuleOverflowMenu = (
  props: ModuleOverflowMenuProps
): JSX.Element | null => {
  const { t } = useTranslation(['device_details', 'heater_shaker'])
  const { module, handleClick, handleAboutClick } = props

  const menuItemsByModuleType = {
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
    heaterShakerModuleType: [
      {
        setSetting: t('set_temperature', { ns: 'heater_shaker' }),
        turnOffSetting: t('deactivate', { ns: 'heater_shaker' }),
        isSecondary: false,
      },
      {
        setSetting: t('set_shake_speed', { ns: 'heater_shaker' }),
        turnOffSetting: t('stop_shaking', { ns: 'heater_shaker' }),
        isSecondary: false,
      },
      {
        setSetting: t('open_labware_latch', { ns: 'heater_shaker' }),
        turnOffSetting: t('close_labware_latch', { ns: 'heater_shaker' }),
        isSecondary: false,
      },
    ],
  }

  const AboutModuleBtn = (
    <MenuItem
      minWidth="10rem"
      key={`about_module_${module.model}`}
      data-testid={`about_module_${module.model}`}
      onClick={() => handleAboutClick()}
    >
      {t('overflow_menu_about')}
    </MenuItem>
  )

  const AttachToDeckBtn = (
    <MenuItem
      minWidth="10rem"
      onClick={() => console.log('how to attach to deck')}
    >
      {t('how_to_attach_to_deck', { ns: 'heater_shaker' })}
    </MenuItem>
  )
  const TestShakeBtn = (
    <MenuItem minWidth="10rem" onClick={() => console.log('test shake')}>
      {t('test_shake', { ns: 'heater_shaker' })}
    </MenuItem>
  )

  return (
    <React.Fragment>
      <Flex position={POSITION_RELATIVE}>
        <MenuList
          buttons={[
            menuItemsByModuleType[module.type].map((item, index) => {
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
            module.type === HEATERSHAKER_MODULE_TYPE ? AttachToDeckBtn : null,
            module.type === HEATERSHAKER_MODULE_TYPE ? TestShakeBtn : null,
          ]}
        />
      </Flex>
    </React.Fragment>
  )
}
