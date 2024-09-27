import { useTranslation } from 'react-i18next'
import * as utils from './utils'

import type { TFunction } from 'i18next'
import type { RunTimeCommand, RobotType } from '@opentrons/shared-data'
import type { CommandTextData } from '../../types'
import type { GetDirectTranslationCommandText } from './utils/getDirectTranslationCommandText'

export interface UseCommandTextStringParams {
  command: RunTimeCommand | null
  commandTextData: CommandTextData | null
  robotType: RobotType
}

export type GetCommandText = UseCommandTextStringParams & { t: TFunction }
export interface GetCommandTextResult {
  /* The actual command text. Ex "Homing all gantry, pipette, and plunger axes" */
  commandText: string
  /* The TC run profile steps.  */
  stepTexts?: string[]
}

// TODO(jh, 07-18-24): Move the testing that covers this from CommandText to a new file, and verify that all commands are
// properly tested.

// Get the full user-facing command text string from a given command.
export function useCommandTextString(
  params: UseCommandTextStringParams
): GetCommandTextResult {
  const { command } = params
  const { t } = useTranslation('protocol_command_text')

  const fullParams = { ...params, t }

  switch (command?.commandType) {
    case 'touchTip':
    case 'home':
    case 'savePosition':
    case 'magneticModule/engage':
    case 'magneticModule/disengage':
    case 'temperatureModule/deactivate':
    case 'thermocycler/waitForBlockTemperature':
    case 'thermocycler/waitForLidTemperature':
    case 'thermocycler/openLid':
    case 'thermocycler/closeLid':
    case 'thermocycler/deactivateBlock':
    case 'thermocycler/deactivateLid':
    case 'thermocycler/awaitProfileComplete':
    case 'heaterShaker/deactivateHeater':
    case 'heaterShaker/openLabwareLatch':
    case 'heaterShaker/closeLabwareLatch':
    case 'heaterShaker/deactivateShaker':
    case 'heaterShaker/waitForTemperature':
      return {
        commandText: utils.getDirectTranslationCommandText(
          fullParams as GetDirectTranslationCommandText
        ),
      }

    case 'aspirate':
    case 'aspirateInPlace':
    case 'dispense':
    case 'dispenseInPlace':
    case 'blowout':
    case 'blowOutInPlace':
    case 'dropTip':
    case 'dropTipInPlace':
    case 'pickUpTip':
      return {
        commandText: utils.getPipettingCommandText(fullParams),
      }

    case 'loadLabware':
    case 'reloadLabware':
    case 'loadPipette':
    case 'loadModule':
    case 'loadLiquid':
      return {
        commandText: utils.getLoadCommandText(fullParams),
      }

    case 'liquidProbe':
    case 'tryLiquidProbe':
      return {
        commandText: utils.getLiquidProbeCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'temperatureModule/setTargetTemperature':
    case 'temperatureModule/waitForTemperature':
    case 'thermocycler/setTargetBlockTemperature':
    case 'thermocycler/setTargetLidTemperature':
    case 'heaterShaker/setTargetTemperature':
      return {
        commandText: utils.getTemperatureCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'thermocycler/runProfile':
      return utils.getTCRunProfileCommandText({ ...fullParams, command })

    case 'heaterShaker/setAndWaitForShakeSpeed':
      return {
        commandText: utils.getHSShakeSpeedCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToSlot':
      return {
        commandText: utils.getMoveToSlotCommandText({ ...fullParams, command }),
      }

    case 'moveRelative':
      return {
        commandText: utils.getMoveRelativeCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToCoordinates':
      return {
        commandText: utils.getMoveToCoordinatesCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToWell':
      return {
        commandText: utils.getMoveToWellCommandText({ ...fullParams, command }),
      }

    case 'moveLabware':
      return {
        commandText: utils.getMoveLabwareCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'configureForVolume':
      return {
        commandText: utils.getConfigureForVolumeCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'configureNozzleLayout':
      return {
        commandText: utils.getConfigureNozzleLayoutCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'prepareToAspirate':
      return {
        commandText: utils.getPrepareToAspirateCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToAddressableArea':
      return {
        commandText: utils.getMoveToAddressableAreaCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToAddressableAreaForDropTip':
      return {
        commandText: utils.getMoveToAddressableAreaForDropTipCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'waitForDuration':
      return {
        commandText: utils.getWaitForDurationCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'pause': // legacy pause command
    case 'waitForResume':
      return {
        commandText: utils.getWaitForResumeCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'delay':
      return {
        commandText: utils.getDelayCommandText({ ...fullParams, command }),
      }

    case 'comment':
      return {
        commandText: utils.getCommentCommandText({ ...fullParams, command }),
      }

    case 'custom':
      return {
        commandText: utils.getCustomCommandText({ ...fullParams, command }),
      }

    case 'setRailLights':
      return {
        commandText: utils.getRailLightsCommandText({ ...fullParams, command }),
      }

    case undefined:
    case null:
      return { commandText: '' }

    default:
      console.warn(
        'CommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return {
        commandText: utils.getUnknownCommandText({ ...fullParams, command }),
      }
  }
}
