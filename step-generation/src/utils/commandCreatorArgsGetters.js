// @flow
// Getter functions for pulling data from CommandCreatorArgs objects.
// NOTE: PD-specific concepts related to CommandCreatorArgs do NOT belong here
// (eg, deriving data related to the concept of substeps)
import type { CommandCreatorArgs } from '../types'

/** If command creator is of a type that uses a pipette, get the pipetteId */
export const getPipetteIdFromCCArgs = (
  args: CommandCreatorArgs
): string | null =>
  args.commandCreatorFnName !== 'delay' &&
  args.commandCreatorFnName !== 'engageMagnet' &&
  args.commandCreatorFnName !== 'disengageMagnet' &&
  args.commandCreatorFnName !== 'setTemperature' &&
  args.commandCreatorFnName !== 'deactivateTemperature' &&
  args.pipette
    ? args.pipette
    : null

/** If command creator is of a type that doesn't ever have wells, return true */
export const getHasNoWellsFromCCArgs = (
  stepArgs: CommandCreatorArgs
): boolean =>
  stepArgs.commandCreatorFnName === 'delay' ||
  stepArgs.commandCreatorFnName === 'engageMagnet' ||
  stepArgs.commandCreatorFnName === 'disengageMagnet' ||
  stepArgs.commandCreatorFnName === 'setTemperature' ||
  stepArgs.commandCreatorFnName === 'deactivateTemperature'
