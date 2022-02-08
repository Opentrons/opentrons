import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, DIRECTION_COLUMN } from '@opentrons/components'
import { THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { OverflowMenu } from '../../../atoms/OverflowMenu'
import { OverflowMenuBtn } from '../../../atoms/OverflowMenu/OverflowMenuBtn'
import { MagneticModuleSlideout } from './MagneticModuleSlideout'

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

  let setSetting: string = ''
  let turnOffSetting: string = ''
  let slideout = <div></div>

  switch (module.type) {
    case 'magneticModuleType': {
      setSetting = t('overflow_menu_engage')
      turnOffSetting = t('overflow_menu_disengage')
      slideout = (
        <MagneticModuleSlideout module={module} isExpanded={showSlideout} />
      )
      break
    }
    case 'temperatureModuleType': {
      setSetting = t('overflow_menu_mod_temp')
      turnOffSetting = t('overflow_menu_deactivate_temp')
      slideout = (
        //  TODO immediately: attach actual slideout!
        <div></div>
      )
      break
    }
    case 'thermocyclerModuleType': {
      setSetting = t('overflow_menu_lid_temp')
      turnOffSetting = t('overflow_menu_set_block_temp')
      slideout = (
        //  TODO immediately: attach actual slideout!
        <div></div>
      )
      break
    }
  }
  return (
    <React.Fragment>
      {showSlideout && slideout}
      <OverflowMenu>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <OverflowMenuBtn
            onClick={() => setShowSlideout(true)}
            data-testid={`module_setting_${module.model}`}
          >
            {setSetting ?? turnOffSetting}
          </OverflowMenuBtn>
          {module.type === THERMOCYCLER_MODULE_TYPE ? (
            <OverflowMenuBtn
              onClick={() => setShowSlideout(true)}
              data-testid={`thermo_block_setting_${module.model}`}
            >
              {t('overflow_menu_set_block_temp')}
            </OverflowMenuBtn>
          ) : null}
          <OverflowMenuBtn
            data-testid={`about_module_${module.model}`}
            //  TODO immediately - add actual module overflow menu
            onClick={() => console.log('about module overflow menu')}
          >
            {t('overflow_menu_about')}
          </OverflowMenuBtn>
        </Flex>
      </OverflowMenu>
    </React.Fragment>
  )
}
