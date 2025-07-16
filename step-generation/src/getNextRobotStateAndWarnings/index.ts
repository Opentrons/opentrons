import assert from 'assert'
import produce from 'immer'

import { stripNoOpCommands } from '../utils/stripNoOpCommands'
import {
  forAbsorbanceReaderCloseLid,
  forAbsorbanceReaderInitialize,
  forAbsorbanceReaderOpenLid,
} from './absorbanceReaderUpdates'
import { forAspirate } from './forAspirate'
import { forBlowout } from './forBlowout'
import { forConfigureNozzleLayout } from './forConfigureNozzleLayout'
import { forDispense } from './forDispense'
import { forDropTip } from './forDropTip'
import { forLoadLiquid } from './forLoadLiquid'
import { forMoveLabware } from './forMoveLabware'
import { forMoveToAddressableArea } from './forMoveToAddressableArea'
import { forMoveToWell } from './forMoveToWell'
import { forPickUpTip } from './forPickUpTip'
import {
  forHeaterShakerCloseLatch,
  forHeaterShakerDeactivateHeater,
  forHeaterShakerOpenLatch,
  forHeaterShakerSetTargetShakeSpeed,
  forHeaterShakerSetTargetTemperature,
  forHeaterShakerStopShake,
} from './heaterShakerUpdates'
import { forBlowOutInPlace, forDropTipInPlace } from './inPlaceCommandUpdates'
import { forDisengageMagnet, forEngageMagnet } from './magnetUpdates'
import {
  forAwaitTemperature,
  forDeactivateTemperature,
  forSetTemperature,
} from './temperatureUpdates'
import {
  forThermocyclerAwaitBlockTemperature,
  forThermocyclerAwaitLidTemperature,
  forThermocyclerAwaitProfileComplete,
  forThermocyclerCloseLid,
  forThermocyclerDeactivateBlock,
  forThermocyclerDeactivateLid,
  forThermocyclerOpenLid,
  forThermocyclerRunProfile,
  forThermocyclerSetTargetBlockTemperature,
  forThermocyclerSetTargetLidTemperature,
} from './thermocyclerUpdates'

import type { CreateCommand } from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

// WARNING this will mutate the prevRobotState
function _getNextRobotStateAndWarningsSingleCommand(
  command: CreateCommand,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  assert(command, 'undefined command passed to getNextRobotStateAndWarning')
  switch (command.commandType) {
    case 'aspirate':
    case 'aspirateInPlace':
      if (command.meta?.isAirGap === true) {
        break
      } else {
        forAspirate(command.params, invariantContext, robotStateAndWarnings)
      }
      break

    case 'dispense':
    case 'dispenseInPlace':
      if (command.meta?.isAirGap === true) {
        break
      } else {
        forDispense(command.params, invariantContext, robotStateAndWarnings)
      }
      break

    case 'blowout':
      forBlowout(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'dropTip':
      forDropTip(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'pickUpTip':
      forPickUpTip(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'magneticModule/engage':
      forEngageMagnet(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'magneticModule/disengage':
      forDisengageMagnet(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'moveLabware':
      forMoveLabware(command.params, invariantContext, robotStateAndWarnings)
      break

    // the following commands currently don't effect tracked robot state
    case 'touchTip': // pipetting
    case 'configureForVolume':
    case 'loadPipette': // setup VVV
    case 'loadLabware':
    case 'loadModule':
    case 'home': // gantry VVV
    case 'moveRelative':
    case 'moveToSlot':
    case 'moveToCoordinates':
    case 'savePosition':
    case 'waitForResume': // timing VVV
    case 'waitForDuration':
    case 'pause': // deprecated, use waitForResume instead
    case 'delay': // deprecated, use waitForDuration instead
    case 'custom': // fall-back
    case 'comment':
    case 'airGapInPlace':
    case 'prepareToAspirate':
    case 'liquidProbe':
    case 'loadLiquidClass':
    case 'getNextTip':
      break

    case 'moveToAddressableArea':
    case 'moveToAddressableAreaForDropTip':
      forMoveToAddressableArea(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'moveToWell':
      forMoveToWell(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'loadLiquid':
      forLoadLiquid(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'dropTipInPlace':
      forDropTipInPlace(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'blowOutInPlace':
      forBlowOutInPlace(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'configureNozzleLayout':
      forConfigureNozzleLayout(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'temperatureModule/setTargetTemperature':
      forSetTemperature(command.params, invariantContext, robotStateAndWarnings)
      break

    case 'temperatureModule/deactivate':
      forDeactivateTemperature(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'temperatureModule/waitForTemperature':
      forAwaitTemperature(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/setTargetBlockTemperature':
      forThermocyclerSetTargetBlockTemperature(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/setTargetLidTemperature':
      forThermocyclerSetTargetLidTemperature(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/waitForBlockTemperature':
      forThermocyclerAwaitBlockTemperature(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/waitForLidTemperature':
      forThermocyclerAwaitLidTemperature(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/deactivateBlock':
      forThermocyclerDeactivateBlock(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/deactivateLid':
      forThermocyclerDeactivateLid(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/closeLid':
      forThermocyclerCloseLid(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/openLid':
      forThermocyclerOpenLid(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/runProfile':
      forThermocyclerRunProfile(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    case 'thermocycler/awaitProfileComplete':
      forThermocyclerAwaitProfileComplete(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'heaterShaker/deactivateHeater':
      forHeaterShakerDeactivateHeater(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'heaterShaker/setTargetTemperature':
      forHeaterShakerSetTargetTemperature(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'heaterShaker/setAndWaitForShakeSpeed':
      forHeaterShakerSetTargetShakeSpeed(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'heaterShaker/deactivateShaker':
      forHeaterShakerStopShake(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'heaterShaker/openLabwareLatch':
      forHeaterShakerOpenLatch(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'heaterShaker/closeLabwareLatch':
      forHeaterShakerCloseLatch(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    //  no state updates required
    case 'heaterShaker/waitForTemperature':
      break
    case 'absorbanceReader/openLid':
      forAbsorbanceReaderOpenLid(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'absorbanceReader/closeLid':
      forAbsorbanceReaderCloseLid(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'absorbanceReader/initialize':
      forAbsorbanceReaderInitialize(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'absorbanceReader/read':
      break
    default:
      assert(
        false,
        `unknown command: ${command.commandType} passed to getNextRobotStateAndWarning`
      )
  }
}

export function getNextRobotStateAndWarningsSingleCommand(
  command: CreateCommand,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  const prevState = {
    warnings: [],
    robotState: prevRobotState,
  }
  return produce(prevState, draft => {
    _getNextRobotStateAndWarningsSingleCommand(command, invariantContext, draft)
  })
}
// Get next state after multiple commands
export function getNextRobotStateAndWarnings(
  commands: CreateCommand[],
  invariantContext: InvariantContext,
  initialRobotState: RobotState
): RobotStateAndWarnings {
  const strippedCommands = stripNoOpCommands(commands)

  const prevState = {
    warnings: [],
    robotState: initialRobotState,
  }
  return produce(prevState, draft => {
    strippedCommands.forEach(command => {
      _getNextRobotStateAndWarningsSingleCommand(
        command,
        invariantContext,
        draft
      )
    })
  })
}
