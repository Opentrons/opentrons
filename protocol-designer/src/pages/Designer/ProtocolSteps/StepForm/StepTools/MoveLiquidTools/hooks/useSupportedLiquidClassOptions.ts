import { useSelector } from 'react-redux'

import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
} from '@opentrons/shared-data'

import { MINIMUM_LIQUID_CLASS_VOLUME } from '../../../../../../../constants'
import { getPipetteEntities } from '../../../../../../../step-forms/selectors'

import type { PathOption } from '@opentrons/step-generation'
import type { FormData } from '../../../../../../../form-types'

export interface LiquidClassOption {
  name: string
  value: string
  subButtonLabel: string
}

export const useSupportedLiquidClassOptions = (
  liquidClassOptions: LiquidClassOption[],
  formData: FormData
): LiquidClassOption[] => {
  const { pipette, tipRack, volume: rawVolume } = formData
  const path = 'path' in formData ? (formData.path as PathOption) : null // handle mix or move liquid forms
  const pipetteEntities = useSelector(getPipetteEntities)
  const liquidClasses = getAllLiquidClassDefs()
  const pipetteEntity = pipetteEntities[pipette]

  // early exit if pipette is not found to be permissive (not practical)
  if (pipetteEntity == null) {
    console.warn('No pipette found')
    return liquidClassOptions
  }

  const pipetteName = getFlexNameConversion(pipetteEntity.spec)
  const volume = Number(rawVolume)
  if (volume < MINIMUM_LIQUID_CLASS_VOLUME) {
    return []
  }

  const supportedOptions = liquidClassOptions.reduce<LiquidClassOption[]>(
    (acc, option) => {
      const liquidClass = liquidClasses[option.value]
      if (liquidClass == null) {
        // 'none' option
        return [...acc, option]
      }
      const byTipLookup = liquidClass?.byPipette
        .find(({ pipetteModel }) => pipetteModel === pipetteName)
        ?.byTipType.find(({ tiprack }) => tiprack === tipRack)
      if (
        byTipLookup == null ||
        (path === 'multiDispense' && !('multiDispense' in byTipLookup))
      ) {
        return acc
      }
      return [...acc, option]
    },
    []
  )
  return supportedOptions
}
