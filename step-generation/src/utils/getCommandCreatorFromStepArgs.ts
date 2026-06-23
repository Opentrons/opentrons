import {
  absorbanceReaderCloseInitialize,
  absorbanceReaderCloseLid,
  absorbanceReaderCloseRead,
  absorbanceReaderOpenLid,
  captureImage,
  comment,
  consolidate,
  deactivateTemperature,
  delay,
  disengageMagnet,
  distribute,
  engageMagnet,
  flexStackerEmpty,
  flexStackerFillItems,
  flexStackerRetrieve,
  flexStackerStore,
  heaterShaker,
  mix,
  moveLabware,
  setTemperature,
  thermocyclerProfileStep,
  thermocyclerStateStep,
  transfer,
  vacuumCloseVent,
  vacuumCloseVentSetPumpPower,
  vacuumCloseVentSetPumpPressure,
  vacuumCloseVentStartProfile,
  vacuumOpenVent,
  vacuumSetPumpPower,
  vacuumSetPumpPressure,
  vacuumStartRunProfile,
  vacuumStopPump,
  waitForModuleTask,
  waitForTemperature,
} from '../commandCreators'
import {
  airGapInPlace,
  aspirateInPlace,
  aspirateWhileTracking,
  blowOutInPlace,
  blowOutInWell,
  configureForVolume,
  configureNozzleLayout,
  dispense,
  dispenseInPlace,
  dispenseWhileTracking,
  dropTip,
  dropTipInPlace,
  heaterShakerCloseLatch,
  heaterShakerDeactivateHeater,
  heaterShakerOpenLatch,
  heaterShakerSetTargetShakeSpeed,
  heaterShakerStopShake,
  home,
  moveRelative,
  moveToAddressableArea,
  moveToAddressableAreaForDropTip,
  moveToCoordinates,
  moveToWell,
  pickUpTip,
  prepareToAspirate,
  thermocyclerCloseLid,
  thermocyclerDeactivateBlock,
  thermocyclerDeactivateLid,
  thermocyclerOpenLid,
  thermocyclerSetTargetBlockTemperature,
  thermocyclerSetTargetLidTemperature,
  thermocyclerStartRunExtendedProfile,
  touchTip,
  tryLiquidProbe,
} from '../commandCreators/atomic'
import { curryCommandCreator } from './curryCommandCreator'

import type { CommandCreatorArgs, CurriedCommandCreator } from '../types'

export const getCommandCreatorFromStepArgs = (
  args: CommandCreatorArgs
): CurriedCommandCreator | null => {
  switch (args.commandCreatorFnName) {
    case 'consolidate':
      return curryCommandCreator(consolidate, args)

    case 'delay':
      return curryCommandCreator(delay, args)

    case 'waitForModuleTask':
      return curryCommandCreator(waitForModuleTask, args)

    case 'distribute':
      return curryCommandCreator(distribute, args)

    case 'transfer':
      return curryCommandCreator(transfer, args)

    case 'mix':
      return curryCommandCreator(mix, args)

    case 'moveLabware':
      return curryCommandCreator(moveLabware, args)

    case 'captureImage':
      return curryCommandCreator(captureImage, args)

    case 'engageMagnet':
      return curryCommandCreator(engageMagnet, args)

    case 'disengageMagnet':
      return curryCommandCreator(disengageMagnet, args)

    case 'setTemperature':
      return curryCommandCreator(setTemperature, args)

    case 'deactivateTemperature':
      return curryCommandCreator(deactivateTemperature, args)

    case 'waitForTemperature':
      return curryCommandCreator(waitForTemperature, args)

    case 'thermocyclerProfile':
      return curryCommandCreator(thermocyclerProfileStep, args)

    case 'thermocyclerState':
      return curryCommandCreator(thermocyclerStateStep, args)

    case 'heaterShaker':
      return curryCommandCreator(heaterShaker, args)

    case 'comment':
      return curryCommandCreator(comment, args)

    case 'absorbanceReaderOpenLid':
      return curryCommandCreator(absorbanceReaderOpenLid, args)

    case 'absorbanceReaderCloseLid':
      return curryCommandCreator(absorbanceReaderCloseLid, args)

    case 'absorbanceReaderRead':
      return curryCommandCreator(absorbanceReaderCloseRead, args)

    case 'absorbanceReaderInitialize':
      return curryCommandCreator(absorbanceReaderCloseInitialize, args)

    case 'flexStackerEmpty':
      return curryCommandCreator(flexStackerEmpty, {
        ...args,
        strategy: 'manualWithPause',
      })

    case 'flexStackerFillItems':
      return curryCommandCreator(flexStackerFillItems, args)

    case 'flexStackerRetrieve':
      return curryCommandCreator(flexStackerRetrieve, args)

    case 'flexStackerStore':
      return curryCommandCreator(flexStackerStore, {
        ...args,
        strategy: 'automatic',
      })

    case 'vacuumCloseVent':
      return curryCommandCreator(vacuumCloseVent, args)

    case 'vacuumOpenVent':
      return curryCommandCreator(vacuumOpenVent, args)

    case 'vacuumSetPumpPower':
      return curryCommandCreator(vacuumSetPumpPower, args)

    case 'vacuumSetPumpPressure':
      return curryCommandCreator(vacuumSetPumpPressure, args)

    case 'vacuumStartRunProfile':
      return curryCommandCreator(vacuumStartRunProfile, args)

    case 'vacuumStopPump':
      return curryCommandCreator(vacuumStopPump, args)
    case 'vacuumCloseVentSetPumpPressure':
      return curryCommandCreator(vacuumCloseVentSetPumpPressure, args)
    case 'vacuumCloseVentSetPumpPower':
      return curryCommandCreator(vacuumCloseVentSetPumpPower, args)
    case 'vacuumCloseVentStartProfile':
      return curryCommandCreator(vacuumCloseVentStartProfile, args)

    // NOTE: ja 6/3/26: here and below are for opentronsAI usage only (for now)
    case 'airGapInPlace':
      return curryCommandCreator(airGapInPlace, args)
    case 'aspirate':
      return curryCommandCreator(airGapInPlace, args)
    case 'aspirateInPlace':
      return curryCommandCreator(aspirateInPlace, args)
    case 'aspirateWhileTracking':
      return curryCommandCreator(aspirateWhileTracking, args)
    case 'blowOutInPlace':
      return curryCommandCreator(blowOutInPlace, args)
    case 'blowout':
      return curryCommandCreator(blowOutInWell, args)
    case 'configureForVolume':
      return curryCommandCreator(configureForVolume, args)
    case 'configureNozzleLayout':
      return curryCommandCreator(configureNozzleLayout, args)
    case 'dispense':
      return curryCommandCreator(dispense, args)
    case 'dispenseInPlace':
      return curryCommandCreator(dispenseInPlace, args)
    case 'dispenseWhileTracking':
      return curryCommandCreator(dispenseWhileTracking, args)
    case 'dropTip':
      return curryCommandCreator(dropTip, args)
    case 'dropTipInPlace':
      return curryCommandCreator(dropTipInPlace, args)
    case 'home':
      return curryCommandCreator(home, args)
    case 'moveRelative':
      return curryCommandCreator(moveRelative, args)
    case 'moveToAddressableArea':
      return curryCommandCreator(moveToAddressableArea, args)
    case 'moveToAddressableAreaForDropTip':
      return curryCommandCreator(moveToAddressableAreaForDropTip, args)
    case 'moveToCoordinates':
      return curryCommandCreator(moveToCoordinates, args)
    case 'moveToWell':
      return curryCommandCreator(moveToWell, args)
    case 'pickUpTip':
      return curryCommandCreator(pickUpTip, args)
    case 'prepareToAspirate':
      return curryCommandCreator(prepareToAspirate, args)
    case 'touchTip':
      return curryCommandCreator(touchTip, args)
    case 'tryLiquidProbe':
      return curryCommandCreator(tryLiquidProbe, args)
    case 'heaterShaker/closeLabwareLatch':
      return curryCommandCreator(heaterShakerCloseLatch, args)
    case 'heaterShaker/openLabwareLatch':
      return curryCommandCreator(heaterShakerOpenLatch, args)
    case 'heaterShaker/setAndWaitForShakeSpeed':
      return curryCommandCreator(heaterShakerSetTargetShakeSpeed, args)
    case 'heaterShaker/deactivateHeater':
      return curryCommandCreator(heaterShakerDeactivateHeater, args)
    case 'heaterShaker/deactivateShaker':
      return curryCommandCreator(heaterShakerStopShake, args)
    case 'thermocycler/closeLid':
      return curryCommandCreator(thermocyclerCloseLid, args)
    case 'thermocycler/openLid':
      return curryCommandCreator(thermocyclerOpenLid, args)
    case 'thermocycler/deactivateBlock':
      return curryCommandCreator(thermocyclerDeactivateBlock, args)
    case 'thermocycler/deactivateLid':
      return curryCommandCreator(thermocyclerDeactivateLid, args)
    case 'thermocycler/setTargetBlockTemperature':
      return curryCommandCreator(thermocyclerSetTargetBlockTemperature, args)
    case 'thermocycler/setTargetLidTemperature':
      return curryCommandCreator(thermocyclerSetTargetLidTemperature, args)
    case 'thermocycler/startRunExtendedProfile':
      return curryCommandCreator(thermocyclerStartRunExtendedProfile, args)
  }
  args satisfies never // Make sure we handle every commandCreatorFnName.
}
