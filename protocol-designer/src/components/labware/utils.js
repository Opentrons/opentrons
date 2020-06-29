// @flow
import { type WellFill, ingredIdsToColor } from '@opentrons/components'
import reduce from 'lodash/reduce'

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
