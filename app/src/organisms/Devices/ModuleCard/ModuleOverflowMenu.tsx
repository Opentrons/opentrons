import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
} from '@opentrons/components'
import {
  THERMOCYCLER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
} from '@opentrons/shared-data'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { MagneticModuleSlideout } from './MagneticModuleSlideout'
import { TemperatureModuleSlideout } from './TemperatureModuleSlideout'
import { ThermocyclerModuleSlideout } from './ThermocyclerModuleSlideout'

import type { AttachedModule } from '../../../redux/modules/types'

interface ModuleOverflowMenuProps {
  module: AttachedModule
}

export const ModuleOverflowMenu = (
  props: ModuleOverflowMenuProps
): JSX.Element | null => {
  const { t } = useTranslation('device_details')
  const { module } = props
  const [showSlideout, setShowSlideout] = React.useState(false)
  const [hasSecondary, setHasSecondary] = React.useState(false)

  const renderSlideOut = (isSecondary: boolean = false): JSX.Element => {
    if (module.type === THERMOCYCLER_MODULE_TYPE) {
      return (
        <ThermocyclerModuleSlideout
          module={module}
          onCloseClick={() => setShowSlideout(false)}
          isExpanded={showSlideout}
          isSecondaryTemp={isSecondary}
        />
      )
    } else if (module.type === MAGNETIC_MODULE_TYPE) {
      return (
        <MagneticModuleSlideout
          module={module}
          onCloseClick={() => setShowSlideout(false)}
          isExpanded={showSlideout}
        />
      )
    } else {
      return (
        <TemperatureModuleSlideout
          model={module.model}
          serial={module.serial}
          onCloseClick={() => setShowSlideout(false)}
          isExpanded={showSlideout}
        />
      )
    }
  }

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
  }

  const handleClick = (isSecondary: boolean = false): void => {
    if (isSecondary) {
      setHasSecondary(true)
    }
    setShowSlideout(true)
  }

  return (
    <React.Fragment>
      {showSlideout && renderSlideOut(hasSecondary)}
      <Flex position={POSITION_RELATIVE}>
        <MenuList>
          <Flex flexDirection={DIRECTION_COLUMN}>
            {menuItems[module.type].map((item, index) => {
              return (
                <MenuItem
                  key={index}
                  onClick={() => handleClick(item.isSecondary)}
                  data-testid={`module_setting_${module.model}`}
                >
                  {/* TODO(sh, 2022-02-11): conditionally render deactivate setting based on module status and pass the required commands. */}
                  {item.setSetting}
                </MenuItem>
              )
            })}
            <MenuItem
              data-testid={`about_module_${module.model}`}
              //  TODO immediately - add actual module overflow menu
              onClick={() => console.log('about module overflow menu')}
            >
              {t('overflow_menu_about')}
            </MenuItem>
          </Flex>
        </MenuList>
      </Flex>
    </React.Fragment>
  )
}
