import * as React from 'react'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import { useTranslation } from 'react-i18next'
import { useHoverTooltip } from '@opentrons/components'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { getProtocolModulesInfo } from '../Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Tooltip } from '../../atoms/Tooltip'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { useProtocolDetailsForRun, useRunStatuses } from '../Devices/hooks'
import { useModuleIdFromRun } from './useModuleIdFromRun'

import type {
  HeaterShakerCloseLatchCreateCommand,
  HeaterShakerDeactivateHeaterCreateCommand,
  HeaterShakerOpenLatchCreateCommand,
  HeaterShakerDeactivateShakerCreateCommand,
  MagneticModuleDisengageCreateCommand,
  TCDeactivateBlockCreateCommand,
  TCDeactivateLidCreateCommand,
  TemperatureModuleDeactivateCreateCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

import type { AttachedModule } from '../../redux/modules/types'

export function useIsHeaterShakerInProtocol(): boolean {
  const currentRunId = useCurrentRunId()
  const { protocolData } = useProtocolDetailsForRun(currentRunId)
  if (protocolData == null) return false
  const protocolModulesInfo = getProtocolModulesInfo(
    protocolData,
    standardDeckDef as any
  )
  return protocolModulesInfo.some(
    module => module.moduleDef.model === 'heaterShakerModuleV1'
  )
}
interface LatchControls {
  toggleLatch: () => void
  isLatchClosed: boolean
}

export function useLatchControls(
  module: AttachedModule,
  isLoadedInRun: boolean,
  runId?: string | null
): LatchControls {
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { createCommand } = useCreateCommandMutation()
  const currentRunId = useCurrentRunId()
  const { isRunTerminal, isRunIdle } = useRunStatuses()

  // const { moduleIdFromRun } = useModuleIdFromRun(
  //   module,
  //   currentRunId != null ? currentRunId : null
  // )

  let moduleId: string | null = null
  if (isRunIdle && currentRunId != null && isLoadedInRun) {
    moduleId = '123'
  } else if ((currentRunId != null && isRunTerminal) || currentRunId == null) {
    moduleId = module.id
  }

  const isLatchClosed =
    module.moduleType === 'heaterShakerModuleType' &&
    (module.data.labwareLatchStatus === 'idle_closed' ||
      module.data.labwareLatchStatus === 'closing')

  const latchCommand:
    | HeaterShakerOpenLatchCreateCommand
    | HeaterShakerCloseLatchCreateCommand = {
    commandType: isLatchClosed
      ? 'heaterShaker/openLabwareLatch'
      : 'heaterShaker/closeLabwareLatch',
    params: {
      moduleId: moduleId != null ? moduleId : '',
    },
  }

  const toggleLatch = (): void => {
    if (isRunIdle && currentRunId != null && isLoadedInRun) {
      createCommand({
        runId: currentRunId,
        command: latchCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${latchCommand.commandType} and run id ${runId}: ${e.message}`
        )
      })
    } else if (
      (currentRunId != null && isRunTerminal) ||
      currentRunId == null
    ) {
      createLiveCommand({
        command: latchCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${latchCommand.commandType}: ${e.message}`
        )
      })
    }
  }
  return { toggleLatch, isLatchClosed }
}
export type MenuItemsByModuleType = {
  [moduleType in AttachedModule['moduleType']]: Array<{
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

type deactivateCommandTypes =
  | 'thermocycler/deactivateLid'
  | 'thermocycler/deactivateBlock'
  | 'temperatureModule/deactivate'
  | 'magneticModule/disengage'
  | 'heaterShaker/deactivateShaker'
  | 'heaterShaker/deactivateHeater'

export function useModuleOverflowMenu(
  module: AttachedModule,
  runId: string | null = null,
  handleAboutClick: () => void,
  handleTestShakeClick: () => void,
  handleWizardClick: () => void,
  handleSlideoutClick: (isSecondary: boolean) => void,
  isLoadedInRun: boolean
): ModuleOverflowMenu {
  const { t } = useTranslation(['device_details', 'heater_shaker'])
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { createCommand } = useCreateCommandMutation()
  const currentRunId = useCurrentRunId()
  const { toggleLatch, isLatchClosed } = useLatchControls(
    module,
    isLoadedInRun,
    currentRunId
  )
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { moduleIdFromRun } = useModuleIdFromRun(module, runId)
  const {
    isLegacySessionInProgress,
    isRunTerminal,
    isRunStill,
    isRunIdle,
  } = useRunStatuses()
  let isDisabled: boolean = false
  if (runId != null && isLoadedInRun) {
    isDisabled = !isRunStill
  } else if ((runId != null || currentRunId != null) && !isLoadedInRun) {
    isDisabled = !isLegacySessionInProgress && !isRunTerminal
  }
  const isLatchDisabled =
    module.moduleType === HEATERSHAKER_MODULE_TYPE &&
    module.data.speedStatus !== 'idle'

  const labwareLatchBtn = (
    <>
      <MenuItem
        key={`hs_labware_latch_${module.moduleModel}`}
        data-testid={`hs_labware_latch_${module.moduleModel}`}
        onClick={toggleLatch}
        disabled={isLatchDisabled || isDisabled}
        {...targetProps}
      >
        {t(
          isLatchClosed
            ? 'heater_shaker:open_labware_latch'
            : 'heater_shaker:close_labware_latch',
          {}
        )}
      </MenuItem>
      {isLatchDisabled ? (
        <Tooltip tooltipProps={tooltipProps}>
          {t('heater_shaker:cannot_open_latch')}
        </Tooltip>
      ) : null}
    </>
  )

  const aboutModuleBtn = (
    <MenuItem
      key={`about_module_${module.moduleModel}`}
      id={`about_module_${module.moduleModel}`}
      data-testid={`about_module_${module.moduleModel}`}
      onClick={() => handleAboutClick()}
    >
      {t('overflow_menu_about')}
    </MenuItem>
  )

  const attachToDeckBtn = (
    <MenuItem
      key={`hs_attach_to_deck_${module.moduleModel}`}
      data-testid={`hs_attach_to_deck_${module.moduleModel}`}
      onClick={() => handleWizardClick()}
    >
      {t('heater_shaker:show_attachment_instructions')}
    </MenuItem>
  )
  const testShakeBtn =
    module.moduleType === HEATERSHAKER_MODULE_TYPE &&
    module.data.speedStatus !== 'idle' ? (
      <MenuItem
        key={`test_shake_${module.moduleModel}`}
        id={`test_shake_${module.moduleModel}`}
        data-testid={`test_shake_${module.moduleModel}`}
        disabled={isDisabled}
        onClick={() =>
          handleDeactivationCommand('heaterShaker/deactivateShaker')
        }
      >
        {t('heater_shaker:deactivate_shaker')}
      </MenuItem>
    ) : (
      <MenuItem
        onClick={() => handleTestShakeClick()}
        key={`hs_test_shake_btn_${module.moduleModel}`}
        disabled={isDisabled}
      >
        {t('heater_shaker:test_shake')}
      </MenuItem>
    )

  let moduleId: string
  if (isRunIdle && currentRunId != null && isLoadedInRun) {
    moduleId = moduleIdFromRun
  } else if ((currentRunId != null && isRunTerminal) || currentRunId == null) {
    moduleId = module.id
  }

  const handleDeactivationCommand = (
    deactivateModuleCommandType: deactivateCommandTypes
  ): void => {
    const deactivateCommand:
      | TemperatureModuleDeactivateCreateCommand
      | MagneticModuleDisengageCreateCommand
      | HeaterShakerDeactivateHeaterCreateCommand
      | TCDeactivateLidCreateCommand
      | TCDeactivateBlockCreateCommand
      | HeaterShakerDeactivateShakerCreateCommand = {
      commandType: deactivateModuleCommandType,
      params: {
        moduleId,
      },
    }
    if (isRunIdle && currentRunId != null && isLoadedInRun) {
      createCommand({
        runId: currentRunId,
        command: deactivateCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${deactivateCommand.commandType} and run id ${runId}: ${e.message}`
        )
      })
    } else if (
      (currentRunId != null && isRunTerminal) ||
      currentRunId == null
    ) {
      createLiveCommand({
        command: deactivateCommand,
      }).catch((e: Error) => {
        console.error(
          `error setting module status with command type ${deactivateCommand.commandType}: ${e.message}`
        )
      })
    }
  }

  const menuOverflowItemsByModuleType = {
    thermocyclerModuleType: [
      {
        setSetting:
          module.moduleType === THERMOCYCLER_MODULE_TYPE &&
          module.data.lidTargetTemperature != null
            ? t('overflow_menu_deactivate_lid')
            : t('overflow_menu_lid_temp'),
        isSecondary: true,
        disabledReason: false,
        menuButtons: null,
        onClick:
          module.moduleType === THERMOCYCLER_MODULE_TYPE &&
          module.data.lidTargetTemperature != null
            ? () => handleDeactivationCommand('thermocycler/deactivateLid')
            : () => handleSlideoutClick(true),
      },
      {
        setSetting:
          module.moduleType === THERMOCYCLER_MODULE_TYPE &&
          module.data.status !== 'idle'
            ? t('overflow_menu_deactivate_block')
            : t('overflow_menu_set_block_temp'),
        isSecondary: false,
        disabledReason: false,
        menuButtons: [aboutModuleBtn],
        onClick:
          module.moduleType === THERMOCYCLER_MODULE_TYPE &&
          module.data.targetTemperature != null
            ? () => handleDeactivationCommand('thermocycler/deactivateBlock')
            : () => handleSlideoutClick(false),
      },
    ],
    temperatureModuleType: [
      {
        setSetting:
          module.moduleType === TEMPERATURE_MODULE_TYPE &&
          module.data.status !== 'idle'
            ? t('overflow_menu_deactivate_temp')
            : t('overflow_menu_mod_temp'),
        isSecondary: false,
        disabledReason: false,
        menuButtons: [aboutModuleBtn],
        onClick:
          module.data.status !== 'idle'
            ? () => handleDeactivationCommand('temperatureModule/deactivate')
            : () => handleSlideoutClick(false),
      },
    ],
    magneticModuleType: [
      {
        setSetting:
          module.moduleType === MAGNETIC_MODULE_TYPE &&
          module.data.status !== 'disengaged'
            ? t('overflow_menu_disengage')
            : t('overflow_menu_engage'),
        isSecondary: false,
        disabledReason: false,
        menuButtons: [aboutModuleBtn],
        onClick:
          module.data.status !== 'disengaged'
            ? () => handleDeactivationCommand('magneticModule/disengage')
            : () => handleSlideoutClick(false),
      },
    ],
    heaterShakerModuleType: [
      {
        setSetting:
          module.moduleType === HEATERSHAKER_MODULE_TYPE &&
          module.data.temperatureStatus !== 'idle'
            ? t('heater_shaker:deactivate_heater')
            : t('heater_shaker:set_temperature'),
        isSecondary: false,
        disabledReason: false,
        menuButtons: [
          labwareLatchBtn,
          aboutModuleBtn,
          attachToDeckBtn,
          testShakeBtn,
        ],
        onClick:
          module.moduleType === HEATERSHAKER_MODULE_TYPE &&
          module.data.temperatureStatus !== 'idle' &&
          module.data.status !== 'idle'
            ? () => handleDeactivationCommand('heaterShaker/deactivateHeater')
            : () => handleSlideoutClick(false),
      },
    ],
  }

  return {
    menuOverflowItemsByModuleType,
  }
}
