import { getFlexNameConversion } from '@opentrons/shared-data'

import type { LiquidClass } from '@opentrons/shared-data'
import type { QuickTransferWizardState } from '../types'

export interface Compatibility {
  pipetteInCompatible?: boolean
  tipRackICompatible?: boolean
  pipettePathInCompatible?: boolean
  volumeInCompatible?: boolean
  inCompatible: boolean
}

const checkTipRackExist = (tipTypes: string[], target: string): boolean => {
  return tipTypes.some(item => {
    const parts = item.split('/')
    return parts.length === 3 && parts[1] === target
  })
}

export const checkLiquidClassCompatibility = (
  liquid: LiquidClass,
  state: QuickTransferWizardState
): Compatibility => {
  const { liquidClassName, byPipette } = liquid
  if (liquidClassName === 'none') {
    return { inCompatible: false }
  }

  if (
    state?.pipette === undefined ||
    state?.tipRack === undefined ||
    state.path === undefined ||
    state.volume === undefined
  ) {
    return { inCompatible: true }
  }

  if (state.volume <= 10) {
    return { inCompatible: true, volumeInCompatible: true }
  }

  const pipetteModels = byPipette.map(pipette => pipette.pipetteModel)
  const tipTypes = byPipette.flatMap(pipette =>
    pipette.byTipType.map(tipType => tipType.tiprack)
  )

  const attachedPipetteModel: string = getFlexNameConversion(state?.pipette)
  const isPipetteCompatible = pipetteModels.includes(attachedPipetteModel)
  const isTipRackCompatible = checkTipRackExist(
    tipTypes,
    state.tipRack.parameters.loadName
  )
  let isPathCompatible = false
  isPathCompatible = byPipette.some(pipette =>
    pipette.byTipType.some(tipType => {
      if (isTipRackCompatible) {
        switch (state.path) {
          case 'single':
            // For 'single' path, check if 'singleDispense' property is defined
            return tipType.singleDispense !== undefined
          case 'multiDispense':
            // For 'multiDispense' path, check if 'multiDispense' property is defined
            return tipType.multiDispense !== undefined
          default:
            return true
        }
      }
    })
  )

  const pipetteInCompatible = !isPipetteCompatible
  const tipRackICompatible = !isTipRackCompatible
  const pipettePathInCompatible = !isPathCompatible
  const inCompatible =
    pipetteInCompatible || tipRackICompatible || pipettePathInCompatible

  return {
    pipetteInCompatible,
    tipRackICompatible,
    pipettePathInCompatible,
    inCompatible,
  }
}
