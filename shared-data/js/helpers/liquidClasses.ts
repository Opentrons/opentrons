import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
  linearInterpolate,
} from '..'

import type { PipetteV2Specs } from '..'

export const getByVolumeValue = (args: {
  liquidClass: string | null
  pipetteSpecs: PipetteV2Specs
  tiprackDefUri: string
  targetVolume: number
  liquidHandlingAction: 'aspirate' | 'singleDispense' | 'multiDispense'
  byVolumeProperty: 'correctionByVolume' | 'flowRateByVolume'
  defaultValue?: number | null
}): number | null => {
  const {
    liquidClass,
    pipetteSpecs,
    tiprackDefUri,
    targetVolume,
    liquidHandlingAction,
    byVolumeProperty,
    defaultValue = null,
  } = args

  const allLiquidClassDefs = getAllLiquidClassDefs()

  if (liquidClass == null) {
    return defaultValue
  }
  const convertedPipetteName = getFlexNameConversion(pipetteSpecs)
  const liquidClassDef =
    allLiquidClassDefs[liquidClass] ?? allLiquidClassDefs.waterV1
  const liquidClassValuesForTip = liquidClassDef.byPipette
    .find(({ pipetteModel }) => convertedPipetteName === pipetteModel)
    ?.byTipType.find(({ tiprack }) => tiprack === tiprackDefUri)
  if (liquidClassValuesForTip == null) {
    return defaultValue
  }

  const liquidHandlingObject =
    liquidHandlingAction === 'multiDispense' &&
    !('multiDispense' in liquidClassValuesForTip)
      ? liquidClassValuesForTip.singleDispense
      : liquidClassValuesForTip[liquidHandlingAction]

  if (liquidHandlingObject == null) {
    return defaultValue
  }
  const byVolume = liquidHandlingObject[byVolumeProperty]
  return (
    linearInterpolate(targetVolume, byVolume as Array<[number, number]>) ??
    defaultValue
  )
}
