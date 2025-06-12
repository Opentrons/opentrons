import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
} from '@opentrons/shared-data'

import { uuid } from '../../../utils'

import type { LoadLiquidClassCreateCommand } from '@opentrons/shared-data'
import type { PipetteEntities } from '@opentrons/step-generation'
import type { SavedStepFormState } from '../../../step-forms/reducers'

export const getLoadLiquidClassCommands = (
  pipetteEntities: PipetteEntities,
  savedStepForms: SavedStepFormState
): LoadLiquidClassCreateCommand[] => {
  const loadedLiquidClasses = new Set<string>()
  const loadLiquidClassCommands = Object.values(savedStepForms).reduce<
    LoadLiquidClassCreateCommand[]
  >((acc, stepForm) => {
    if ('liquidClass' in stepForm) {
      const { pipette, liquidClass: rawLiquidClass, tipRack } = stepForm
      const liquidClass = rawLiquidClass as string
      const pipetteEntity = pipetteEntities[pipette]
      if (pipetteEntity == null) {
        return acc
      }
      const { spec: pipetteSpecs } = pipetteEntity
      const pipetteModel = getFlexNameConversion(pipetteSpecs)

      // creating a unique string to avoid duplicate loadLiquidClass commands
      // for the same liquid class, pipette model, and tip rack
      const uniqueString = `${liquidClass}-${pipetteModel}-${tipRack}`
      const byTipTypeSettings =
        liquidClass != null
          ? getAllLiquidClassDefs()
              [liquidClass]?.byPipette.find(
                pipetteObject => pipetteObject.pipetteModel === pipetteModel
              )
              ?.byTipType.find(({ tiprack }) => tiprack === tipRack)
          : null

      if (byTipTypeSettings != null && !loadedLiquidClasses.has(uniqueString)) {
        loadedLiquidClasses.add(uniqueString)
        return [
          ...acc,
          {
            key: uuid(),
            commandType: 'loadLiquidClass' as const,
            params: {
              liquidClassRecord: {
                ...byTipTypeSettings,
                liquidClassName: liquidClass,
                pipetteModel,
              },
            },
          },
        ]
      }
    }
    return acc
  }, [])

  return loadLiquidClassCommands
}
