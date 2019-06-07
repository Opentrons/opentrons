// @flow
import reduce from 'lodash/reduce'
import { ingredIdsToColor, type WellFill } from '@opentrons/components'
import type { ContentsByWell, WellContents } from '../../labware-ingred/types'

export const wellFillFromWellContents = (
  wellContents: ContentsByWell
): WellFill =>
  reduce(
    wellContents,
    (acc, wellContents: WellContents, wellName) => {
      const wellFill = ingredIdsToColor(wellContents.groupIds)
      return wellFill ? { ...acc, [wellName]: wellFill } : acc
    },
    {}
  )
