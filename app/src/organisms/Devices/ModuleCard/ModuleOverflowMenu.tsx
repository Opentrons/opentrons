import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  POSITION_RELATIVE,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  CreateCommand,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
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

  let typeOfCommand: CreateCommand['commandType']
  switch (module.type) {
    case 'temperatureModuleType': {
      typeOfCommand = 'temperatureModule/deactivate'
      break
    }
    case 'magneticModuleType': {
      typeOfCommand = 'magneticModule/disengageMagnet'
      break
    }
    case 'thermocyclerModuleType': {
      typeOfCommand =
        module.status !== 'idle'
          ? 'thermocycler/deactivateBlock'
          : 'thermocycler/deactivateLid'
      break
    }
    case 'heaterShakerModuleType': {
      typeOfCommand = 'heaterShakerModule/deactivateHeater'
      break
    }
  }

  const deactivateCommand: CreateCommand = {
    commandType: typeOfCommand,
    //  TODO replace serial with id
    params: { moduleId: module.serial },
  }

  const handleDeactivation = (): void => {
    createLiveCommand({
      command: deactivateCommand,
    })
  }

  const getOnClickCommand = (isSecondary: boolean = false): void => {
    if (module.type === THERMOCYCLER_MODULE_TYPE) {
      if (isSecondary) {
        if (module.data.lidTarget !== null) {
          return handleDeactivation()
        } else {
          return handleClick(isSecondary)
        }
      } else {
        if (module.status !== 'idle') {
          return handleDeactivation()
        } else {
          return handleClick(isSecondary)
        }
      }
    } else if (module.type === HEATERSHAKER_MODULE_TYPE) {
      if (isSecondary) {
        if (module.data.currentSpeed !== 0) {
          //  TODO(jr, 3/11/22): plug in command here, how do we deactivate the shaking?
          return console.log('Deactivate shake')
        } else {
          return handleClick(isSecondary)
        }
      } else {
        if (module.status !== 'idle') {
          return handleDeactivation()
        } else {
          return handleClick(isSecondary)
        }
      }
    } else if (module.type === TEMPERATURE_MODULE_TYPE) {
      if (module.status !== 'idle') {
        return handleDeactivation()
      } else {
        return handleClick(isSecondary)
      }
    } else {
      if (module.status !== 'disengaged') {
        return handleDeactivation()
      } else {
        return handleClick(isSecondary)
      }
    }
  }

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
        setSetting:
          module.type === THERMOCYCLER_MODULE_TYPE &&
          module.data.lidTarget !== null
            ? t('overflow_menu_deactivate_lid')
            : t('overflow_menu_lid_temp'),
        isSecondary: true,
      },
      {
        setSetting:
          module.type === THERMOCYCLER_MODULE_TYPE && module.status !== 'idle'
            ? t('overflow_menu_deactivate_block')
            : t('overflow_menu_set_block_temp'),
        isSecondary: false,
      },
    ],
    temperatureModuleType: [
      {
        setSetting:
          module.type === TEMPERATURE_MODULE_TYPE && module.status !== 'idle'
            ? t('overflow_menu_deactivate_temp')
            : t('overflow_menu_mod_temp'),
        isSecondary: false,
      },
    ],
    magneticModuleType: [
      {
        setSetting:
          module.type === MAGNETIC_MODULE_TYPE && module.status !== 'disengaged'
            ? t('overflow_menu_disengage')
            : t('overflow_menu_engage'),

        isSecondary: false,
      },
    ],
    heaterShakerModuleType: [
      {
        setSetting:
          module.type === HEATERSHAKER_MODULE_TYPE && module.status !== 'idle'
            ? t('deactivate', { ns: 'heater_shaker' })
            : t('set_temperature', { ns: 'heater_shaker' }),

        isSecondary: false,
      },
      {
        setSetting:
          module.type === HEATERSHAKER_MODULE_TYPE &&
          module.data.currentSpeed === 0
            ? t('set_shake_speed', { ns: 'heater_shaker' })
            : t('stop_shaking', { ns: 'heater_shaker' }),
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
        key={`hs_labware_latch_${module.model}`}
        data-testid={`hs_labware_latch_${module.model}`}
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
    <MenuItem
      minWidth="10rem"
      key={`hs_attach_to_deck_${module.model}`}
      data-testid={`hs_attach_to_deck_${module.model}`}
      onClick={() => setShowWizard(true)}
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
                  onClick={() => getOnClickCommand(item.isSecondary)}
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
