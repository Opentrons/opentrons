import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { getAllLiquidClassDefs } from '@opentrons/shared-data'

import {
  getCurrentFormIsPresaved,
  getCurrentFormUnsavedChangedFields,
  getLabwareEntities,
  getLiquidEntities,
  getPipetteEntities,
} from '/protocol-designer/step-forms/selectors'
import { getAllWellContentsForActiveItem } from '/protocol-designer/top-selectors/well-contents'

import { selectors as labwareIngredSelectors } from '../../../../../../../labware-ingred/selectors'
import { getEntireWellSelection } from '../../../PipetteFields/NozzleAndWellSelectionModal/utils'
import { getShouldUpdateForLiquidClass } from '../../../utils'

import type {
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { FormData } from '/protocol-designer/form-types'

export interface LiquidClassOption {
  name: string
  value: string
  subButtonLabel: string
}

export function useAssignLiquidClass(
  formData: FormData,
  labwareField: string,
  wellsField: string,
  updateValue: (_: string) => void
): LiquidClassOption[] {
  const allWellContentsForActiveItem = useSelector(
    getAllWellContentsForActiveItem
  )
  const { t } = useTranslation('liquids')
  const liquids = useSelector(getLiquidEntities)
  const currentFormIsPresaved = useSelector(getCurrentFormIsPresaved)
  const labwareEntities = useSelector(getLabwareEntities)
  const liquidEntities = useSelector(getLiquidEntities)
  const allIngredientGroupFields = useSelector(
    labwareIngredSelectors.allIngredientGroupFields
  )
  const liquidsInLabware = useSelector(
    labwareIngredSelectors.getLiquidsByLabwareId
  )[formData[labwareField]]
  const pipetteEntities = useSelector(getPipetteEntities)
  const pipetteChannels = pipetteEntities[formData.pipette]?.spec.channels ?? 1
  const nozzlesConfigured = formData.nozzles as NozzleConfigurationStyle
  const primaryNozzle =
    formData.primaryNozzle as PrimaryNozzleConfigurationStyle
  const labwareDef = labwareEntities[formData[labwareField]]?.def
  const allWellsAdjustedForPipette =
    labwareDef != null
      ? [
          ...new Set(
            (formData[wellsField] as string[]).flatMap(well =>
              getEntireWellSelection(
                well,
                labwareDef.ordering,
                nozzlesConfigured,
                primaryNozzle,
                pipetteChannels
              )
            )
          ),
        ]
      : (formData[wellsField] as string[])

  const liquidClassesInSourceWellsSet = allWellsAdjustedForPipette.reduce<
    Set<string>
  >((acc, wellName) => {
    const liquidGroupsInWell = liquidsInLabware?.[wellName] ?? {}
    for (const liquidGroup of Object.keys(liquidGroupsInWell)) {
      const liquidClass = allIngredientGroupFields[liquidGroup]?.liquidClass
      if (liquidClass != null) {
        acc.add(liquidClass)
      }
    }
    return acc
  }, new Set<string>())
  const liquidClasses = getAllLiquidClassDefs()
  const liquidClassToLiquidsMap: Record<string, string[]> = {}
  Object.values(liquids).forEach(({ displayName, liquidClass }) => {
    if (liquidClass != null) {
      if (!liquidClassToLiquidsMap[liquidClass]) {
        liquidClassToLiquidsMap[liquidClass] = []
      }
      liquidClassToLiquidsMap[liquidClass].push(displayName)
    }
  })
  const noLiquidClass: LiquidClassOption = {
    name: t('dont_use_liquid_class') as string,
    value: 'none',
    subButtonLabel: t('default') as string,
  }
  const liquidClassOptions = [
    ...Object.entries(liquidClasses).map(([liquidClassName, def]) => ({
      name: def.displayName,
      value: liquidClassName,
      subButtonLabel: (liquidClassToLiquidsMap[liquidClassName] != null &&
      liquidClassesInSourceWellsSet.has(liquidClassName)
        ? t('assigned_liquid', {
            liquidName: liquidClassToLiquidsMap[liquidClassName].join(', '),
          })
        : def.description) as string,
    })),
    noLiquidClass,
  ]
  const changedFields = useSelector(getCurrentFormUnsavedChangedFields)
  const shouldUpdate = getShouldUpdateForLiquidClass(
    changedFields,
    formData.stepType
  )
  const aspirateLabwareLiquids =
    allWellContentsForActiveItem?.[formData[labwareField]]

  const [orderedLiquidClassOptions, setOrderedLiquidClassOptions] =
    useState<LiquidClassOption[]>(liquidClassOptions)

  useEffect(
    () => {
      if (aspirateLabwareLiquids != null) {
        let runningLiquidClass: string | null = null
        for (let i = 0; i < allWellsAdjustedForPipette.length; i++) {
          const well = allWellsAdjustedForPipette[i]
          const uniqueLiquidClassesInWell = new Set(
            aspirateLabwareLiquids[well].groupIds.reduce<string[]>(
              (acc, id) => {
                const liquidClass = liquidEntities[id]?.liquidClass
                return liquidClass != null ? [...acc, liquidClass] : acc
              },
              []
            )
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
        setOrderedLiquidClassOptions(
          liquidClassOptions.sort((a, _) =>
            a.value === (runningLiquidClass ?? 'none') ? -1 : 1
          )
        )
        if (currentFormIsPresaved || shouldUpdate) {
          updateValue(runningLiquidClass ?? 'none')
        }
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formData[wellsField], formData[labwareField]]
  )

  return orderedLiquidClassOptions
}
