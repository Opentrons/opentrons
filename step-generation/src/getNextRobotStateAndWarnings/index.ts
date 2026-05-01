import { produce } from 'immer'

import { stripNoOpCommands } from '../utils/stripNoOpCommands'
import {
  forAbsorbanceReaderCloseLid,
  forAbsorbanceReaderInitialize,
  forAbsorbanceReaderOpenLid,
} from './absorbanceReaderUpdates'
import { forAirGapInPlace } from './forAirGapInPlace'
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
import { forSetTipState } from './forSetTipState'
import { forWaitForTasks } from './forWaitForTasks'
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
  forFlexStackerEmpty,
  forFlexStackerFill,
  forFlexStackerFillItems,
  forFlexStackerRetrieve,
  forFlexStackerSetStoredLabware,
  forFlexStackerSetStoredLabwareItems,
  forFlexStackerStore,
} from './stackerUpdates'
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
  forThermocyclerRunExtendedProfile,
  forThermocyclerRunProfile,
  forThermocyclerSetTargetBlockTemperature,
  forThermocyclerSetTargetLidTemperature,
  forThermocyclerStartRunExtendedProfile,
} from './thermocyclerUpdates'
import {
  forVacuumCloseVent,
  forVacuumOpenVent,
  forVacuumSetPumpPower,
  forVacuumSetPumpPressure,
  forVacuumStartRunProfile,
  forVacuumStopPump,
} from './vacuumUpdates'

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
  if (!command) {
    throw new Error('undefined command passed to getNextRobotStateAndWarning')
  }
  switch (command.commandType) {
    case 'aspirateWhileTracking':
    case 'aspirate':
    case 'aspirateInPlace':
      //  TODO: robot state will be updated for air gaps in PV since completedProtocolAnalysis
      //  won't have isAirGap... so we need to figure out a fix for this but not sure how
      if (command.meta?.isAirGap === true) {
        break
      } else {
        forAspirate(command.params, invariantContext, robotStateAndWarnings)
      }
      break

    case 'airGapInPlace':
      forAirGapInPlace(command.params, invariantContext, robotStateAndWarnings)
      break
    case 'dispenseWhileTracking':
    case 'dispense':
    case 'dispenseInPlace':
      //  TODO: robot state will be updated for air gaps in PV since completedProtocolAnalysis
      //  won't have isAirGap... so we need to figure out a fix for this but not sure how
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

    case 'setTipState':
      forSetTipState(command.params, invariantContext, robotStateAndWarnings)
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

    case 'waitForTasks':
      forWaitForTasks(command.params, invariantContext, robotStateAndWarnings)
      break

    // setStoredLabware state update is only needed for PV
    case 'flexStacker/setStoredLabware':
      forFlexStackerSetStoredLabware(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    // setStoredLabwareItems state update is not actually in use yet
    // it will be used when PD allows changing the labwareType midway through
    // the protocol
    case 'flexStacker/setStoredLabwareItems':
      forFlexStackerSetStoredLabwareItems(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break

    // unsafe commands, no need to update state
    case 'flexStacker/prepareShuttle':
    case 'flexStacker/closeLatch':
    case 'flexStacker/openLatch':
      break

    case 'flexStacker/empty':
      forFlexStackerEmpty(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'flexStacker/fill':
      forFlexStackerFill(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'flexStacker/fillItems':
      forFlexStackerFillItems(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'flexStacker/retrieve':
      forFlexStackerRetrieve(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'flexStacker/store':
      forFlexStackerStore(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
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
    case 'captureImage':
    case 'prepareToAspirate':
    case 'liquidProbe':
    case 'loadLiquidClass':
    case 'loadLidStack':
    case 'loadLid':
    case 'getTipPresence':
    case 'identifyModule':
    case 'getNextTip':
    case 'retractAxis':
    case 'sealPipetteToTip':
    case 'tryLiquidProbe':
    case 'unsealPipetteFromTip':
    case 'verifyTipPresence':
    case 'pressureDispense': //  evo tip specific command
    case 'createTimer':
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
    case 'thermocycler/runExtendedProfile':
      forThermocyclerRunExtendedProfile(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'thermocycler/startRunExtendedProfile':
      forThermocyclerStartRunExtendedProfile(
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
    case 'vacuumModule/startSetVacuumPressure':
      forVacuumSetPumpPressure(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'vacuumModule/startSetVacuumPower':
      forVacuumSetPumpPower(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'vacuumModule/openVent':
      forVacuumOpenVent(command.params, invariantContext, robotStateAndWarnings)
      break
    case 'vacuumModule/closeVent':
      forVacuumCloseVent(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    case 'vacuumModule/stopVacuum':
      forVacuumStopPump(command.params, invariantContext, robotStateAndWarnings)
      break
    case 'vacuumModule/startRunProfile':
      forVacuumStartRunProfile(
        command.params,
        invariantContext,
        robotStateAndWarnings
      )
      break
    default:
      console.error(
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
