import {
  absorbanceReaderModuleIdRequired,
  aspirateAirGapVolumeRequired,
  aspirateDelayDurationRequired,
  aspirateLabwareRequired,
  aspirateMixTimesRequired,
  aspirateMixVolumeRequired,
  aspirateTouchTipMmFromEdgeOutOfRange,
  aspirateTouchTipMmFromEdgeRequired,
  aspirateWellsRequired,
  blockTargetTempHoldRange,
  blockTargetTempRange,
  blockTemperatureHoldRequired,
  blockTemperatureRequired,
  blowoutFlowRateRequired,
  blowoutLocationRequired,
  composeErrors,
  conditioningVolumeOutOfRange,
  conditioningVolumeRequired,
  dispenseAirGapVolumeRequired,
  dispenseDelayDurationRequired,
  dispenseLabwareRequired,
  dispenseMixTimesRequired,
  dispenseMixVolumeRequired,
  dispenseTouchTipMmFromEdgeOutOfRange,
  dispenseTouchTipMmFromEdgeRequired,
  dispenseWellsRequired,
  engageHeightRangeExceeded,
  engageHeightRequired,
  fileNameRequired,
  incompatibleAspirateLabware,
  incompatibleDispenseLabware,
  incompatibleLabware,
  labwareToMoveRequired,
  lidTargetTempHoldRange,
  lidTargetTempRange,
  lidTemperatureHoldRequired,
  lidTemperatureRequired,
  magnetActionRequired,
  magneticModuleIdRequired,
  messageRequired,
  mixLabwareRequired,
  mixWellsRequired,
  moduleIdRequired,
  newLabwareLocationRequired,
  pauseActionRequired,
  pauseForTimeOrUntilTold,
  pauseModuleRequired,
  pauseTemperatureRequired,
  pipetteRequired,
  profileTargetLidTempRange,
  profileTargetLidTempRequired,
  profileVolumeRange,
  profileVolumeRequired,
  pushOutVolumeOutOfRange,
  pushOutVolumeRequired,
  referenceWavelengthOutOfRange,
  referenceWavelengthRequired,
  shakeSpeedRequired,
  shakeTimeRequired,
  targetHeaterShakerTemperatureRange,
  targetSpeedRange,
  targetTemperatureRange,
  targetTemperatureRequired,
  temperatureRequired,
  timesRequired,
  transferVolumeMax,
  transferVolumeMin,
  volumeRequired,
  volumeTooHigh,
  wavelengthOutOfRange,
  wavelengthRequired,
  wellRatioMoveLiquid,
} from './errors'
import {
  belowPipetteMinimumVolume,
  composeWarnings,
  incompatibleLiquidClass,
  maxDispenseWellVolume,
  minAspirateAirGapVolume,
  minDispenseAirGapVolume,
  minDisposalVolume,
  mixTipPositionInTube,
  tipPositionInTube,
} from './warnings'

import type {
  LabwareEntities,
  ModuleEntities,
} from '@opentrons/step-generation'
import type {
  HydratedAbsorbanceReaderFormData,
  HydratedCommentFormData,
  HydratedFormData,
  HydratedHeaterShakerFormData,
  HydratedMagnetFormData,
  HydratedMixFormData,
  HydratedMoveLabwareFormData,
  HydratedMoveLiquidFormData,
  HydratedPauseFormData,
  HydratedTemperatureFormData,
  HydratedThermocyclerFormData,
  StepType,
} from '../../form-types'
import type { FormError } from './errors'
import type { FormWarning, FormWarningType } from './warnings'

export { handleFormChange } from './handleFormChange'
export { createBlankForm } from './createBlankForm'
export { getDefaultsForStepType } from './getDefaultsForStepType'
export { getDisabledFields } from './getDisabledFields'
export { getNextDefaultPipetteId } from './getNextDefaultPipetteId'
export {
  getNextDefaultTemperatureModuleId,
  getNextDefaultThermocyclerModuleId,
} from './getNextDefaultModuleId'
export { getNextDefaultMagnetAction } from './getNextDefaultMagnetAction'
export { getNextDefaultEngageHeight } from './getNextDefaultEngageHeight'
export { stepFormToArgs } from './stepFormToArgs'
export type { FormError, FormWarning, FormWarningType }

interface StepFormDataMap {
  absorbanceReader: HydratedAbsorbanceReaderFormData
  heaterShaker: HydratedHeaterShakerFormData
  mix: HydratedMixFormData
  pause: HydratedPauseFormData
  moveLabware: HydratedMoveLabwareFormData
  moveLiquid: HydratedMoveLiquidFormData
  magnet: HydratedMagnetFormData
  temperature: HydratedTemperatureFormData
  thermocycler: HydratedThermocyclerFormData
  comment: HydratedCommentFormData
}
interface FormHelpers<K extends keyof StepFormDataMap> {
  getErrors: (
    arg: StepFormDataMap[K],
    moduleEntities: ModuleEntities,
    labwareEntities: LabwareEntities
  ) => FormError[]
  getWarnings?: (arg: StepFormDataMap[K]) => FormWarning[] // Changed to match step type
}
const stepFormHelperMap: {
  [K in keyof StepFormDataMap]: FormHelpers<K>
} = {
  absorbanceReader: {
    getErrors: composeErrors(
      wavelengthRequired,
      referenceWavelengthRequired,
      fileNameRequired,
      wavelengthOutOfRange,
      referenceWavelengthOutOfRange,
      absorbanceReaderModuleIdRequired
    ),
  },
  heaterShaker: {
    getErrors: composeErrors(
      shakeSpeedRequired,
      shakeTimeRequired,
      temperatureRequired,
      targetSpeedRange,
      targetHeaterShakerTemperatureRange,
      moduleIdRequired
    ),
  },
  mix: {
    getErrors: composeErrors(
      incompatibleLabware,
      volumeTooHigh,
      mixWellsRequired,
      mixLabwareRequired,
      volumeRequired,
      timesRequired,
      aspirateDelayDurationRequired,
      dispenseDelayDurationRequired,
      blowoutLocationRequired,
      pushOutVolumeOutOfRange,
      pushOutVolumeRequired,
      blowoutFlowRateRequired,
      transferVolumeMax,
      transferVolumeMin,
      pipetteRequired
    ),
    getWarnings: composeWarnings(
      belowPipetteMinimumVolume,
      mixTipPositionInTube,
      incompatibleLiquidClass
    ),
  },
  pause: {
    getErrors: composeErrors(
      pauseActionRequired,
      pauseTemperatureRequired,
      pauseModuleRequired,
      pauseForTimeOrUntilTold
    ),
  },
  moveLabware: {
    getErrors: composeErrors(labwareToMoveRequired, newLabwareLocationRequired),
  },
  moveLiquid: {
    getErrors: composeErrors(
      incompatibleAspirateLabware,
      incompatibleDispenseLabware,
      wellRatioMoveLiquid,
      volumeRequired,
      aspirateLabwareRequired,
      dispenseLabwareRequired,
      aspirateMixTimesRequired,
      aspirateMixVolumeRequired,
      aspirateDelayDurationRequired,
      aspirateAirGapVolumeRequired,
      dispenseMixTimesRequired,
      dispenseMixVolumeRequired,
      dispenseDelayDurationRequired,
      dispenseAirGapVolumeRequired,
      blowoutLocationRequired,
      aspirateWellsRequired,
      dispenseWellsRequired,
      // TODO (nd: 04/17/2025): re-wire up the following errors once speed getters are implemented in migration
      // aspirateTouchTipSpeedRequired,
      // dispenseTouchTipSpeedRequired,
      pushOutVolumeRequired,
      pushOutVolumeOutOfRange,
      aspirateTouchTipMmFromEdgeOutOfRange,
      dispenseTouchTipMmFromEdgeOutOfRange,
      aspirateTouchTipMmFromEdgeRequired,
      dispenseTouchTipMmFromEdgeRequired,
      conditioningVolumeRequired,
      conditioningVolumeOutOfRange,
      blowoutFlowRateRequired,
      transferVolumeMax,
      transferVolumeMin,
      pipetteRequired
    ),
    getWarnings: composeWarnings(
      belowPipetteMinimumVolume,
      maxDispenseWellVolume,
      minDisposalVolume,
      minAspirateAirGapVolume,
      minDispenseAirGapVolume,
      tipPositionInTube,
      incompatibleLiquidClass
    ),
  },
  magnet: {
    getErrors: composeErrors(
      magnetActionRequired,
      engageHeightRequired,
      moduleIdRequired,
      engageHeightRangeExceeded,
      magneticModuleIdRequired
    ),
  },
  temperature: {
    getErrors: composeErrors(
      targetTemperatureRequired,
      moduleIdRequired,
      targetTemperatureRange
    ),
  },
  thermocycler: {
    getErrors: composeErrors(
      blockTemperatureRequired,
      lidTemperatureRequired,
      profileVolumeRequired,
      profileTargetLidTempRequired,
      blockTemperatureHoldRequired,
      lidTemperatureHoldRequired,
      lidTargetTempHoldRange,
      blockTargetTempHoldRange,
      profileVolumeRange,
      profileTargetLidTempRange,
      lidTargetTempRange,
      blockTargetTempRange
    ),
  },
  comment: {
    getErrors: composeErrors(messageRequired),
  },
}

export const getFormErrors = (
  stepType: StepType,
  formData: HydratedFormData,
  moduleEntities: ModuleEntities,
  labwareEntities: LabwareEntities
): FormError[] => {
  //  manualIntervention is the initial starting deck state step
  if (stepType === 'manualIntervention') {
    return []
  }

  //  TODO: try to find a cleaner way to write this via mapping
  //  while also making TS happy
  switch (stepType) {
    case 'absorbanceReader':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedAbsorbanceReaderFormData,
        moduleEntities,
        labwareEntities
      )
    case 'heaterShaker':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedHeaterShakerFormData,
        moduleEntities,
        labwareEntities
      )

    case 'magnet':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedMagnetFormData,
        moduleEntities,
        labwareEntities
      )

    case 'mix':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedMixFormData,
        moduleEntities,
        labwareEntities
      )

    case 'moveLabware':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedMoveLabwareFormData,
        moduleEntities,
        labwareEntities
      )

    case 'moveLiquid':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedMoveLiquidFormData,
        moduleEntities,
        labwareEntities
      )

    case 'pause':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedPauseFormData,
        moduleEntities,
        labwareEntities
      )

    case 'temperature':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedTemperatureFormData,
        moduleEntities,
        labwareEntities
      )

    case 'thermocycler':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedThermocyclerFormData,
        moduleEntities,
        labwareEntities
      )

    case 'comment':
      return stepFormHelperMap[stepType].getErrors(
        formData as HydratedCommentFormData,
        moduleEntities,
        labwareEntities
      )
  }
}

export const getFormWarnings = (
  stepType: StepType,
  formData: HydratedFormData
): FormWarning[] => {
  //  manualIntervention is the initial starting deck state step
  if (stepType === 'manualIntervention') {
    return []
  }

  //  TODO: try to find a cleaner way to write this via mapping
  //  while also making TS happy
  switch (stepType) {
    case 'mix':
      return stepFormHelperMap.mix.getWarnings != null
        ? stepFormHelperMap.mix.getWarnings(formData as HydratedMixFormData)
        : []
    case 'moveLiquid':
      return stepFormHelperMap.moveLiquid.getWarnings != null
        ? stepFormHelperMap.moveLiquid.getWarnings(
            formData as HydratedMoveLiquidFormData
          )
        : []
    default:
      //  NOTE: if a new form has warnings, we need to wire it up!
      return []
  }
}
