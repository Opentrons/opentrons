import { MIXED_WELL_COLOR } from '@opentrons/step-generation'

import type { ContentsByWell, WellContents } from '@opentrons/step-generation'

export const getWellFillFromWellContents = (
  wellContents: ContentsByWell,
  liquidDisplayColors: Record<string, string>
): Record<string, string> => {
  if (wellContents == null) return {}

  const wellFill: Record<string, string> = {}

  Object.entries(wellContents as Record<string, WellContents>).forEach(
    ([wellName, contents]) => {
      const { groupIds } = contents
      const filteredGroupIds = groupIds.filter(id => id !== '__air__')

      if (filteredGroupIds.length === 0) {
        return
      }

      if (filteredGroupIds.length === 1) {
        const liquidId = filteredGroupIds[0]
        const color = liquidDisplayColors[liquidId]
        if (color != null) {
          wellFill[wellName] = color
        }
      } else {
        wellFill[wellName] = MIXED_WELL_COLOR
      }
    }
  )

  return wellFill
}
