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
import { OverflowMenu } from '../../../atoms/OverflowMenu'
import { OverflowMenuBtn } from '../../../atoms/OverflowMenu/OverflowMenuBtn'
import { MagneticModuleSlideout } from './MagneticModuleSlideout'
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
          isExpanded={showSlideout}
          isSecondaryTemp={isSecondary}
        />
      )
    } else if (module.type === MAGNETIC_MODULE_TYPE) {
      return (
        <MagneticModuleSlideout module={module} isExpanded={showSlideout} />
      )
    } else {
      return <div />
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
        <OverflowMenu>
          <Flex flexDirection={DIRECTION_COLUMN}>
            {menuItems[module.type].map((item, index) => {
              return (
                <OverflowMenuBtn
                  key={index}
                  onClick={() => handleClick(item.isSecondary)}
                  data-testid={`module_setting_${module.model}`}
                >
                  {item.setSetting}
                </OverflowMenuBtn>
              )
            })}
            <OverflowMenuBtn
              data-testid={`about_module_${module.model}`}
              //  TODO immediately - add actual module overflow menu
              onClick={() => console.log('about module overflow menu')}
            >
              {t('overflow_menu_about')}
            </OverflowMenuBtn>
          </Flex>
        </OverflowMenu>
      </Flex>
    </React.Fragment>
  )
}
