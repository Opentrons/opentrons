import {
  CutoutId,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  RunTimeCommand,
} from '@opentrons/shared-data'
import * as StepGeneration from '@opentrons/step-generation'
import { configureForVolume, pickUpTip } from '../commandCreators/atomic'
import type { InvariantContext } from '../types'

export const commandCreatorFromStepArgs = (
  args: RunTimeCommand,
  invariantContext: InvariantContext,
  prevCommand: RunTimeCommand | null
): StepGeneration.CurriedCommandCreator | null => {
  const {
    trashBinEntities,
    wasteChuteEntities,
    labwareEntities,
  } = invariantContext
  const tiprack = Object.values(labwareEntities).find(
    lw => lw.def.parameters.isTiprack
  )?.labwareDefURI
  switch (args.commandType) {
    case 'moveLabware': {
      return StepGeneration.curryCommandCreator(
        StepGeneration.moveLabware,
        args.params
      )
    }

    case 'magneticModule/engage':
      return StepGeneration.curryCommandCreator(
        StepGeneration.engageMagnet,
        args.params
      )

    case 'magneticModule/disengage':
      return StepGeneration.curryCommandCreator(
        StepGeneration.disengageMagnet,
        args.params
      )

    case 'temperatureModule/setTargetTemperature':
      return StepGeneration.curryCommandCreator(
        StepGeneration.setTemperature,
        args.params
      )

    case 'temperatureModule/deactivate':
      return StepGeneration.curryCommandCreator(
        StepGeneration.deactivateTemperature,
        args.params
      )
    case 'configureForVolume':
      return StepGeneration.curryCommandCreator(configureForVolume, {
        ...args.params,
      })
    case 'aspirate':
      return tiprack != null
        ? StepGeneration.curryCommandCreator(StepGeneration.aspirate, {
            ...args.params,
            tipRack: tiprack,
            nozzles: null,
          })
        : null
    case 'pickUpTip':
      return StepGeneration.curryCommandCreator(pickUpTip, {
        ...args.params,
      })
    case 'dispense':
      return StepGeneration.curryCommandCreator(StepGeneration.dispense, {
        ...args.params,
        tipRack: '',
        nozzles: null,
      })
    case 'dropTipInPlace':
      const prevAddressableAreaName =
        prevCommand != null && 'addressableAreaName' in prevCommand.params
          ? prevCommand.params.addressableAreaName
          : null
      const isATrashBin = MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
        prevAddressableAreaName
      )
      const trashLocation = isATrashBin
        ? Object.values(trashBinEntities)[0].id
        : Object.values(wasteChuteEntities)[0].id

      console.log(
        prevCommand != null
          ? StepGeneration.curryCommandCreator(StepGeneration.dropTipInTrash, {
              ...args.params,
              trashLocation: trashLocation as CutoutId,
            })
          : null
      )
      return prevCommand != null
        ? StepGeneration.curryCommandCreator(StepGeneration.dropTipInTrash, {
            ...args.params,
            trashLocation: trashLocation as CutoutId,
          })
        : null
    case 'moveToAddressableAreaForDropTip':
      return null

    case 'moveToAddressableArea':
      const addressableAreaName = args.params.addressableAreaName
      const isTrashBin = MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
        addressableAreaName
      )
      const fixtureId = isTrashBin
        ? Object.values(trashBinEntities)[0].id
        : Object.values(wasteChuteEntities)[0].id
      return StepGeneration.curryCommandCreator(
        StepGeneration.moveToAddressableArea,
        {
          ...args.params,
          fixtureId,
        }
      )
    // case 'heaterShaker/waitForTemperature':
    //   return StepGeneration.curryCommandCreator(
    //     StepGeneration.waitForTemperature,
    //     args.params
    //   )

    // case 'thermocyclerProfile':
    //   return StepGeneration.curryCommandCreator(
    //     StepGeneration.thermocyclerProfileStep,
    //     args
    //   )

    // case 'thermocyclerState':
    //   return StepGeneration.curryCommandCreator(
    //     StepGeneration.thermocyclerStateStep,
    //     args
    //   )
    // case 'heaterShaker':
    //   return StepGeneration.curryCommandCreator(
    //     StepGeneration.heaterShaker,
    //     args
    //   )
    case 'comment':
      return StepGeneration.curryCommandCreator(
        StepGeneration.comment,
        args.params
      )
    // case 'absorbanceReaderOpenLid':
    //   return StepGeneration.curryCommandCreator(
    //     StepGeneration.absorbanceReaderOpenLid,
    //     args
    //   )
    // case 'absorbanceReaderCloseLid':
    //   return StepGeneration.curryCommandCreator(
    //     StepGeneration.absorbanceReaderCloseLid,
    //     args
    //   )
    // case 'absorbanceReaderRead':
    //   return StepGeneration.curryCommandCreator(
    //     StepGeneration.absorbanceReaderCloseRead,
    //     args
    //   )
    // case 'absorbanceReaderInitialize':
    //   return StepGeneration.curryCommandCreator(
    //     StepGeneration.absorbanceReaderCloseInitialize,
    //     args
    //   )
  }
  // @ts-expect-error we've exhausted all command creators, but keeping this console warn
  // for when we impelement the next command creator
  console.warn(`unhandled commandCreatorFnName: ${args.commandCreatorFnName}`)
  return null
}
