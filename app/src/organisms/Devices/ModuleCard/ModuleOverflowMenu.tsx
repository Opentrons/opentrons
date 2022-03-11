import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  POSITION_RELATIVE,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { CreateCommand, HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'
import { MenuList } from '../../../atoms/MenuList'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'
import { HeaterShakerWizard } from '../HeaterShakerWizard'

import type { AttachedModule } from '../../../redux/modules/types'

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
  const [showWizard, setShowWizard] = React.useState<boolean>(false)
  const [isLatchClosed, setIsLatchClosed] = React.useState<boolean>(true)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const [targetProps, tooltipProps] = useHoverTooltip()

  const latchCommand: CreateCommand = {
    commandType: isLatchClosed
      ? 'heaterShakerModule/openLatch'
      : 'heaterShakerModule/closeLatch',
    //  TODO replace serial with id
    params: { moduleId: module.serial },
  }

  const handleLatch = (): void => {
    createLiveCommand({
      command: latchCommand,
    })
    latchCommand.commandType === 'heaterShakerModule/openLatch'
      ? setIsLatchClosed(false)
      : setIsLatchClosed(true)
  }

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
        isSecondary: true,
      },
    ],
  }

  const latchDisabledReason =
    module.type === HEATERSHAKER_MODULE_TYPE &&
    module.data.speedStatus !== 'idle'

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
  const LabwareLatchBtn = (
    <>
      <MenuItem
        minWidth="10rem"
        onClick={handleLatch}
        disabled={latchDisabledReason}
        {...targetProps}
      >
        {t(isLatchClosed ? 'open_labware_latch' : 'close_labware_latch', {
          ns: 'heater_shaker',
        })}
      </MenuItem>
      {/* TODO:(jr, 3/11/22): update Tooltip to new design */}
      {latchDisabledReason ? (
        <Tooltip {...tooltipProps}>
          {t('cannot_open_latch', { ns: 'heater_shaker' })}
        </Tooltip>
      ) : null}
    </>
  )

  const AttachToDeckBtn = (
    <MenuItem minWidth="10rem" onClick={() => setShowWizard(true)}>
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
      {showWizard && (
        <HeaterShakerWizard onCloseClick={() => setShowWizard(false)} />
      )}
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
            module.type === HEATERSHAKER_MODULE_TYPE ? LabwareLatchBtn : null,
            AboutModuleBtn,
            module.type === HEATERSHAKER_MODULE_TYPE ? AttachToDeckBtn : null,
            module.type === HEATERSHAKER_MODULE_TYPE ? TestShakeBtn : null,
          ]}
        />
      </Flex>
    </React.Fragment>
  )
}
