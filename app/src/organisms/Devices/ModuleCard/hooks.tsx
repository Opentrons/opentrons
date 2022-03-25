import * as React from 'react'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { useTranslation } from 'react-i18next'
import { Tooltip, useHoverTooltip } from '@opentrons/components'
import {
  CreateCommand,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import { MenuItem } from '../../../atoms/MenuList/MenuItem'

import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerDeactivateHeaterCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  HeaterShakerStopShakeCreateCommand,
  MagneticModuleDisengageMagnetCreateCommand,
  TCDeactivateBlockCreateCommand,
  TCDeactivateLidCreateCommand,
  TemperatureModuleDeactivateCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'
import type { AttachedModule } from '../../../redux/modules/types'

interface LatchCommand {
  handleLatch: () => void
  isLatchClosed: boolean
}

export function useLatchCommand(module: AttachedModule): LatchCommand {
  const { createLiveCommand } = useCreateLiveCommandMutation()

  const isLatchClosed =
    module.type === 'heaterShakerModuleType' &&
    (module.data.labwareLatchStatus === 'idle_closed' ||
      module.data.labwareLatchStatus === 'closing')

  const latchCommand:
    | HeaterShakerOpenLatchCreateCommand
    | HeaterShakerCloseLatchCreateCommand = {
    commandType: isLatchClosed
      ? 'heaterShakerModule/openLatch'
      : 'heaterShakerModule/closeLatch',
    params: { moduleId: module.id },
  }

  const handleLatch = (): void => {
    createLiveCommand({
      command: latchCommand,
    }).catch((e: Error) => {
      console.error(
        `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
      )
    })
  }
  return { handleLatch, isLatchClosed }
}

export interface MenuItemsByModuleType {
  thermocyclerModuleType: Array<{
    setSetting: string
    isSecondary: boolean
    disabledReason: boolean
    menuButtons: JSX.Element | null
    onClick: (isSecondary: boolean) => void
  }>
  magneticModuleType: Array<{
    setSetting: string
    isSecondary: boolean
    disabledReason: boolean
    menuButtons: JSX.Element
    onClick: (isSecondary: boolean) => void
  }>
  temperatureModuleType: Array<{
    setSetting: string
    isSecondary: boolean
    disabledReason: boolean
    menuButtons: JSX.Element
    onClick: (isSecondary: boolean) => void
  }>
  heaterShakerModuleType: Array<{
    setSetting: string
    isSecondary: boolean
    disabledReason: boolean
    menuButtons: JSX.Element[] | null
    onClick: (isSecondary: boolean) => void
  }>
}

interface ModuleOverflowMenu {
  menuOverflowItemsByModuleType: MenuItemsByModuleType
}

export function useModuleOverflowMenu(
  module: AttachedModule,
  handleAboutClick: () => void,
  handleTestShakeClick: () => void,
  handleWizardClick: () => void,
  handleClick: (isSecondary: boolean) => void
): ModuleOverflowMenu {
  const { t } = useTranslation(['device_details', 'heater_shaker'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { handleLatch, isLatchClosed } = useLatchCommand(module)
  const [targetProps, tooltipProps] = useHoverTooltip()

  let commandType: CreateCommand['commandType']
  switch (module.type) {
    case 'temperatureModuleType': {
      commandType = 'temperatureModule/deactivate'
      break
    }
    case 'magneticModuleType': {
      commandType = 'magneticModule/disengageMagnet'
      break
    }
    case 'thermocyclerModuleType': {
      commandType =
        module.data.lidTarget !== null && module.status !== 'idle'
          ? 'thermocycler/deactivateLid'
          : 'thermocycler/deactivateBlock'
      break
    }
    case 'heaterShakerModuleType': {
      commandType =
        module.data.speedStatus !== 'idle'
          ? 'heaterShakerModule/stopShake'
          : 'heaterShakerModule/deactivateHeater'
      break
    }
  }

  const deactivateCommand:
    | TemperatureModuleDeactivateCreateCommand
    | MagneticModuleDisengageMagnetCreateCommand
    | HeaterShakerDeactivateHeaterCreateCommand
    | TCDeactivateLidCreateCommand
    | TCDeactivateBlockCreateCommand
    | HeaterShakerStopShakeCreateCommand = {
    commandType: commandType,
    params: { moduleId: module.id },
  }

  const isLatchDisabled =
    module.type === HEATERSHAKER_MODULE_TYPE &&
    module.data.speedStatus !== 'idle'

  const labwareLatchBtn = (
    <>
      <MenuItem
        minWidth="10rem"
        key={`hs_labware_latch_${module.model}`}
        data-testid={`hs_labware_latch_${module.model}`}
        onClick={handleLatch}
        disabled={isLatchDisabled}
        {...targetProps}
      >
        {t(isLatchClosed ? 'open_labware_latch' : 'close_labware_latch', {
          ns: 'heater_shaker',
        })}
      </MenuItem>
      {/* TODO:(jr, 3/11/22): update Tooltip to new design */}
      {isLatchDisabled ? (
        <Tooltip {...tooltipProps} key={`tooltip_latch_${module.model}`}>
          {t('cannot_open_latch', { ns: 'heater_shaker' })}
        </Tooltip>
      ) : null}
    </>
  )

  const aboutModuleBtn = (
    <MenuItem
      minWidth="10rem"
      key={`about_module_${module.model}`}
      id={`about_module_${module.model}`}
      data-testid={`about_module_${module.model}`}
      onClick={() => handleAboutClick()}
    >
      {t('overflow_menu_about')}
    </MenuItem>
  )

  const attachToDeckBtn = (
    <MenuItem
      minWidth="10rem"
      key={`hs_attach_to_deck_${module.model}`}
      data-testid={`hs_attach_to_deck_${module.model}`}
      onClick={() => handleWizardClick()}
    >
      {t('how_to_attach_to_deck', { ns: 'heater_shaker' })}
    </MenuItem>
  )
  const testShakeBtn = (
    <MenuItem
      minWidth="10rem"
      onClick={() => handleTestShakeClick()}
      key={`hs_test_shake_btn_${module.model}`}
    >
      {t('test_shake', { ns: 'heater_shaker' })}
    </MenuItem>
  )

  const handleDeactivationCommand = (): void => {
    createLiveCommand({
      command: deactivateCommand,
    }).catch((e: Error) => {
      console.error(
        `error setting module status with command type ${deactivateCommand.commandType}: ${e.message}`
      )
    })
  }

  const onClick =
    module.status !== 'idle'
      ? () => handleDeactivationCommand()
      : () => handleClick(false)

  const menuOverflowItemsByModuleType = {
    thermocyclerModuleType: [
      {
        setSetting:
          module.type === THERMOCYCLER_MODULE_TYPE &&
          module.data.lidTarget !== null
            ? t('overflow_menu_deactivate_lid')
            : t('overflow_menu_lid_temp'),
        isSecondary: true,
        disabledReason: false,
        menuButtons: null,
        onClick:
          module.type === THERMOCYCLER_MODULE_TYPE &&
          module.data.lidTarget !== null
            ? () => handleDeactivationCommand()
            : () => handleClick(true),
      },
      {
        setSetting:
          module.type === THERMOCYCLER_MODULE_TYPE && module.status !== 'idle'
            ? t('overflow_menu_deactivate_block')
            : t('overflow_menu_set_block_temp'),
        isSecondary: false,
        disabledReason: false,
        menuButtons: aboutModuleBtn,
        onClick: onClick,
      },
    ],
    temperatureModuleType: [
      {
        setSetting:
          module.type === TEMPERATURE_MODULE_TYPE && module.status !== 'idle'
            ? t('overflow_menu_deactivate_temp')
            : t('overflow_menu_mod_temp'),
        isSecondary: false,
        disabledReason: false,
        menuButtons: aboutModuleBtn,
        onClick: onClick,
      },
    ],
    magneticModuleType: [
      {
        setSetting:
          module.type === MAGNETIC_MODULE_TYPE && module.status !== 'disengaged'
            ? t('overflow_menu_disengage')
            : t('overflow_menu_engage'),

        isSecondary: false,
        disabledReason: false,
        menuButtons: aboutModuleBtn,
        onClick:
          module.status !== 'disengaged'
            ? () => handleDeactivationCommand()
            : () => handleClick(false),
      },
    ],
    heaterShakerModuleType: [
      {
        setSetting:
          module.type === HEATERSHAKER_MODULE_TYPE && module.status !== 'idle'
            ? t('deactivate', { ns: 'heater_shaker' })
            : t('set_temperature', { ns: 'heater_shaker' }),
        isSecondary: false,
        disabledReason: false,
        menuButtons: null,
        onClick: onClick,
      },
      {
        setSetting:
          module.type === HEATERSHAKER_MODULE_TYPE && module.status === 'idle'
            ? t('set_shake_speed', { ns: 'heater_shaker' })
            : t('stop_shaking', { ns: 'heater_shaker' }),
        isSecondary: true,
        disabledReason:
          module.type === HEATERSHAKER_MODULE_TYPE &&
          (module.data.labwareLatchStatus === 'idle_open' ||
            module.data.labwareLatchStatus === 'opening'),
        menuButtons: [
          labwareLatchBtn,
          aboutModuleBtn,
          attachToDeckBtn,
          testShakeBtn,
        ],
        onClick:
          module.type === HEATERSHAKER_MODULE_TYPE &&
          module.data.speedStatus !== 'idle'
            ? () => handleDeactivationCommand()
            : () => handleClick(true),
      },
    ],
  }

  return {
    menuOverflowItemsByModuleType,
  }
}
