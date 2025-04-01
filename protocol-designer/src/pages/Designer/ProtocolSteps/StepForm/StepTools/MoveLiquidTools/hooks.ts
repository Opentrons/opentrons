import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getAllWellsFromPrimaryWells } from '../../../../../../steplist/formLevel/handleFormChange/utils'
import {
  getCurrentFormIsPresaved,
  getLabwareEntities,
  getLiquidEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import { getAllWellContentsForActiveItem } from '../../../../../../top-selectors/well-contents'
import type { FormData } from '../../../../../../form-types'

export function useAssignLiquidClass(
  formData: FormData,
  updateValue: (_: string) => void
): string {
  const { aspirate_wells, aspirate_labware } = formData
  const allWellContentsForActiveItem = useSelector(
    getAllWellContentsForActiveItem
  )
  const aspirateLabwareLiquids =
    allWellContentsForActiveItem?.[aspirate_labware]
  const currentFormIsPresaved = useSelector(getCurrentFormIsPresaved)
  const labwareEntities = useSelector(getLabwareEntities)
  const pipetteEntities = useSelector(getPipetteEntities)
  const liquidEntities = useSelector(getLiquidEntities)
  const channels = pipetteEntities[formData.pipette]?.spec.channels ?? 1
  const allWellsAdjustedForPipette =
    channels !== 1
      ? getAllWellsFromPrimaryWells(
          aspirate_wells as string[],
          labwareEntities[aspirate_labware].def,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          channels
        )
      : aspirate_wells

  const [assignedLiquidClass, setAssignedLiquidClass] = useState<string | null>(
    null
  )

  useEffect(() => {
    if (aspirateLabwareLiquids != null) {
      let runningLiquidClass: string | null = null
      for (let i = 0; i < allWellsAdjustedForPipette.length; i++) {
        const well = allWellsAdjustedForPipette[i]
        const uniqueLiquidClassesInWell = new Set(
          aspirateLabwareLiquids[well].groupIds.reduce<string[]>((acc, id) => {
            const liquidClass = liquidEntities[id].liquidClass
            return liquidClass != null ? [...acc, liquidClass] : acc
          }, [])
        )
        if (uniqueLiquidClassesInWell.size > 1) {
          // well contains more than one liquid class, so break
          break
        } else if (uniqueLiquidClassesInWell.size === 0) {
          // well contains no liquid classes than one liquid class, so continue to next well
          continue
        } else {
          // well contains a single liquid class, so assign
          const liquidClass = Array.from(uniqueLiquidClassesInWell)[0]
          if (
            // liquid class differs from that of a previous well
            liquidClass !== runningLiquidClass &&
            runningLiquidClass != null
          ) {
            runningLiquidClass = null
            break
          } else {
            // first single liquid class encountered
            runningLiquidClass = liquidClass
          }
        }
      }
      setAssignedLiquidClass(runningLiquidClass)
      if (currentFormIsPresaved) {
        updateValue(runningLiquidClass ?? 'none')
      }
    }
  }, [formData.aspirate_wells, formData.aspirate_labware])
  return assignedLiquidClass ?? 'none'
}
