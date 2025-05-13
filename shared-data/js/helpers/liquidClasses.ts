import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  linearInterpolate,
} from '..'

import type { PipetteV2Specs } from '..'

export const getCorrectionVolume = (args: {
  liquidClass: string | null
  pipetteSpecs: PipetteV2Specs
  tiprackDefUri: string
  targetVolume: number
  liquidHandlingAction: 'aspirate' | 'singleDispense' | 'multiDispense'
}): number | null => {
  const {
    liquidClass,
    pipetteSpecs,
    tiprackDefUri,
    targetVolume,
    liquidHandlingAction,
  } = args
  const allLiquidClassDefs = getAllLiquidClassDefs()

  if (liquidClass == null) {
    return null
  }
  const convertedPipetteName = getFlexNameConversion(pipetteSpecs)
  const liquidClassDef =
    allLiquidClassDefs[liquidClass] ?? allLiquidClassDefs.waterV1
  const liquidClassValuesForPipette = liquidClassDef.byPipette.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = liquidClassValuesForPipette?.byTipType.find(
    ({ tiprack }) => tiprack === tiprackDefUri
  )
  if (liquidClassValuesForTip == null) {
    return null
  }
  const liquidHandlingObject =
    liquidHandlingAction === 'multiDispense' &&
    !('multiDispense' in liquidClassValuesForTip)
      ? liquidClassValuesForTip.singleDispense
      : liquidClassValuesForTip[liquidHandlingAction]

  if (liquidHandlingObject == null) {
    return null
  }
  const { correctionByVolume } = liquidHandlingObject
  return linearInterpolate(
    targetVolume,
    correctionByVolume as Array<[number, number]>
  )
}
