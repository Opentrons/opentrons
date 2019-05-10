// @flow
import assert from 'assert'
import * as React from 'react'
import reduce from 'lodash/reduce'

import { ingredIdsToColor } from '@opentrons/components'
import SingleLabware from './SingleLabware'
import type { ContentsByWell, WellContents } from '../../labware-ingred/types'
import type { WellIngredientNames } from '../../steplist/types'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import WellTooltip from './WellTooltip'

type Props = {|
  definition: ?LabwareDefinition2,
  ingredNames: WellIngredientNames,
  wellContents: ContentsByWell,
|}

export default function BrowsableLabware(props: Props) {
  const { definition, ingredNames, wellContents } = props
  if (!definition) {
    assert(definition, 'BrowseLabwareModal expected definition')
    return null
  }

  const wellFill = reduce(
    // TODO IMMEDIATELY
    wellContents,
    (acc, wellContents: WellContents, wellName) => ({
      ...acc,
      [wellName]: ingredIdsToColor(wellContents.groupIds),
    }),
    {}
  )

  return (
    <WellTooltip ingredNames={ingredNames}>
      {({
        makeHandleMouseEnterWell,
        handleMouseLeaveWell,
        tooltipWellName,
      }) => (
        <SingleLabware
          definition={definition}
          showLabels
          wellFill={wellFill}
          highlightedWells={
            new Set(
              reduce(
                wellContents,
                (acc, wellContents, wellName): Array<string> =>
                  tooltipWellName === wellName ? [...acc, wellName] : acc,
                []
              )
            )
          }
          onMouseEnterWell={({ event, wellName }) =>
            makeHandleMouseEnterWell(wellName, wellContents[wellName].ingreds)(
              event
            )
          }
          onMouseLeaveWell={handleMouseLeaveWell}
        />
      )}
    </WellTooltip>
  )
}
