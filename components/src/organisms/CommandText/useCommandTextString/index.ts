import { useTranslation } from 'react-i18next'

import * as utils from './utils'

import type { TFunction } from 'i18next'
import type {
  LabwareDefinition,
  RobotType,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type {
  GetDirectTranslationCommandText,
  TCProfileCycleText,
  TCProfileStepText,
} from './utils'

export * from './utils'

export interface UseCommandTextStringParams {
  command: RunTimeCommand | null
  allRunDefs: LabwareDefinition[]
  commandTextData: utils.CommandTextData | null
  robotType: RobotType
}

export type GetCommandText = UseCommandTextStringParams & { t: TFunction }
export interface GetGenericCommandTextResult {
  kind: 'generic'
  /* The actual command text. Ex "Homing all gantry, pipette, and plunger axes" */
  commandText: string
}
export interface GetTCRunProfileCommandTextResult {
  kind: 'thermocycler/runProfile'
  commandText: string
  /* The TC run profile steps.  */
  stepTexts: string[]
}
export interface GetTCRunExtendedProfileCommandTextResult {
  kind: 'thermocycler/runExtendedProfile'
  commandText: string
  profileElementTexts: Array<TCProfileStepText | TCProfileCycleText>
}
export interface GetTCStartRunExtendedProfileCommandTextResult {
  kind: 'thermocycler/startRunExtendedProfile'
  commandText: string
  profileElementTexts: Array<TCProfileStepText | TCProfileCycleText>
}
export type GetCommandTextResult =
  | GetGenericCommandTextResult
  | GetTCRunProfileCommandTextResult
  | GetTCRunExtendedProfileCommandTextResult
  | GetTCStartRunExtendedProfileCommandTextResult

// TODO(jh, 07-18-24): Move the testing that covers this from CommandText to a new file, and verify that all commands are
// properly tested.

// Get the full user-facing command text string from a given command.
// Must support all run time commands.
// If you are adding a new command, please add support for it here.
export function useCommandTextString(
  params: UseCommandTextStringParams
): GetCommandTextResult {
  const { command } = params
  const { t } = useTranslation(['protocol_command_text', 'branded'])

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
        kind: 'generic',
        commandText: utils.getDirectTranslationCommandText(
          fullParams as GetDirectTranslationCommandText
        ),
      }

    case 'aspirate':
    case 'aspirateInPlace':
    case 'dispense':
    case 'dispenseInPlace':
    case 'aspirateWhileTracking':
    case 'dispenseWhileTracking':
    case 'blowout':
    case 'blowOutInPlace':
    case 'dropTip':
    case 'dropTipInPlace':
    case 'pickUpTip':
    case 'airGapInPlace':
    case 'sealPipetteToTip':
    case 'unsealPipetteFromTip':
    case 'pressureDispense':
    case 'verifyTipPresence':
    case 'getTipPresence':
      return {
        kind: 'generic',
        commandText: utils.getPipettingCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'loadLabware':
    case 'reloadLabware':
    case 'loadLid':
    case 'loadLidStack':
    case 'loadPipette':
    case 'loadModule':
    case 'loadLiquid':
    case 'loadLiquidClass':
      return {
        kind: 'generic',
        commandText: utils.getLoadCommandText(fullParams),
      }

    case 'liquidProbe':
    case 'tryLiquidProbe':
      return {
        kind: 'generic',
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
        kind: 'generic',
        commandText: utils.getTemperatureCommandText({
          ...fullParams,
          command,
        }),
      }
    case 'absorbanceReader/openLid':
    case 'absorbanceReader/closeLid':
    case 'absorbanceReader/initialize':
    case 'absorbanceReader/read':
      return {
        kind: 'generic',
        commandText: utils.getAbsorbanceReaderCommandText({
          ...fullParams,
          command,
        }),
      }
    case 'flexStacker/retrieve':
    case 'flexStacker/store':
    case 'flexStacker/setStoredLabware':
    case 'flexStacker/setStoredLabwareItems':
    case 'flexStacker/empty':
    case 'flexStacker/fill':
    case 'flexStacker/fillItems':
      return {
        kind: 'generic',
        commandText: utils.getFlexStackerCommandText({
          ...fullParams,
          command,
        }),
      }
    case 'thermocycler/runProfile':
      return utils.getTCRunProfileCommandText({ ...fullParams, command })

    case 'thermocycler/runExtendedProfile':
      return utils.getTCRunExtendedProfileCommandText({
        ...fullParams,
        command,
      })

    case 'thermocycler/startRunExtendedProfile':
      return utils.getTCStartRunExtendedProfileCommandText({
        ...fullParams,
        command,
      })

    case 'heaterShaker/setAndWaitForShakeSpeed':
      return {
        kind: 'generic',
        commandText: utils.getHSShakeSpeedCommandText({
          ...fullParams,
          command,
        }),
      }
    case 'heaterShaker/setShakeSpeed':
      return {
        kind: 'generic',
        commandText: utils.getHSConcurrentShakeSpeedCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToSlot':
      return {
        kind: 'generic',
        commandText: utils.getMoveToSlotCommandText({ ...fullParams, command }),
      }

    case 'moveRelative':
      return {
        kind: 'generic',
        commandText: utils.getMoveRelativeCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToCoordinates':
      return {
        kind: 'generic',
        commandText: utils.getMoveToCoordinatesCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToWell':
      return {
        kind: 'generic',
        commandText: utils.getMoveToWellCommandText({ ...fullParams, command }),
      }

    case 'moveLabware':
      return {
        kind: 'generic',
        commandText: utils.getMoveLabwareCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'retractAxis':
      return {
        kind: 'generic',
        commandText: utils.getRetractAxisCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'configureForVolume':
      return {
        kind: 'generic',
        commandText: utils.getConfigureForVolumeCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'configureNozzleLayout':
      return {
        kind: 'generic',
        commandText: utils.getConfigureNozzleLayoutCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'prepareToAspirate':
      return {
        kind: 'generic',
        commandText: utils.getPrepareToAspirateCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'getNextTip':
      return {
        kind: 'generic',
        commandText: t('get_next_tip'),
      }

    case 'moveToAddressableArea':
      return {
        kind: 'generic',
        commandText: utils.getMoveToAddressableAreaCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'moveToAddressableAreaForDropTip':
      return {
        kind: 'generic',
        commandText: utils.getMoveToAddressableAreaForDropTipCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'waitForDuration':
      return {
        kind: 'generic',
        commandText: utils.getWaitForDurationCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'pause': // legacy pause command
    case 'waitForResume':
      return {
        kind: 'generic',
        commandText: utils.getWaitForResumeCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'delay':
      return {
        kind: 'generic',
        commandText: utils.getDelayCommandText({ ...fullParams, command }),
      }

    case 'comment':
      return {
        kind: 'generic',
        commandText: utils.getCommentCommandText({ ...fullParams, command }),
      }

    case 'custom':
      return {
        kind: 'generic',
        commandText: utils.getCustomCommandText({ ...fullParams, command }),
      }

    case 'setRailLights':
      return {
        kind: 'generic',
        commandText: utils.getRailLightsCommandText({ ...fullParams, command }),
      }

    case 'setTipState':
      return {
        kind: 'generic',
        commandText: utils.getTipStateCommandText({ ...fullParams, command }),
      }

    case 'robot/moveTo':
    case 'robot/moveAxesTo':
    case 'robot/moveAxesRelative':
    case 'robot/openGripperJaw':
    case 'robot/closeGripperJaw':
      return {
        kind: 'generic',
        commandText: utils.getRobotCommandText({ ...fullParams, command }),
      }
    case 'waitForTasks':
    case 'createTimer': {
      return {
        kind: 'generic',
        commandText: utils.getConcurrentCommandText({ ...fullParams, command }),
      }
    }

    case 'captureImage': {
      return {
        kind: 'generic',
        commandText: utils.getRobotDevicesCommandText({
          ...fullParams,
          command,
        }),
      }
    }

    case 'calibration/calibratePipette':
    case 'calibration/calibrateGripper':
    case 'calibration/calibrateModule':
    case 'calibration/moveToMaintenancePosition':
      return {
        kind: 'generic',
        commandText: utils.getCalibrationCommandText({
          ...fullParams,
          command,
        }),
      }
    case 'setStatusBar':
      return {
        kind: 'generic',
        commandText: utils.getSetStatusBarCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'identifyModule':
      return {
        kind: 'generic',
        commandText: utils.getIdentifyModuleCommandText({
          ...fullParams,
          command,
        }),
      }

    case 'unsafe/blowOutInPlace':
    case 'unsafe/dropTipInPlace':
    case 'unsafe/updatePositionEstimators':
    case 'unsafe/engageAxes':
    case 'unsafe/ungripLabware':
    case 'unsafe/placeLabware':
    case 'unsafe/flexStacker/manualRetrieve':
    case 'unsafe/flexStacker/closeLatch':
    case 'unsafe/flexStacker/openLatch':
    case 'unsafe/flexStacker/prepareShuttle':
      return {
        kind: 'generic',
        commandText: utils.getUnsafeCommandText({
          ...fullParams,
          command,
        }),
      }

    case undefined:
    case null:
      return { kind: 'generic', commandText: '' }

    // No default case is provided because all commands must be handled explicitly
    // If you are adding a default case, something has gone wrong.
    // Please add any new commands to the switch statement above
    // Do not add a default case here thank you :)
  }
}
