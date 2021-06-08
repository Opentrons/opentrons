// @flow
import assert from 'assert'
import * as React from 'react'
import reduce from 'lodash/reduce'

import { SingleLabware } from './SingleLabware'
import { wellFillFromWellContents } from './utils'
import { ContentsByWell } from '../../labware-ingred/types'
import { WellIngredientNames } from '../../steplist/types'
import { WellGroup } from '@opentrons/components'
import { LabwareDefinition2 } from '@opentrons/shared-data'

import { WellTooltip } from './WellTooltip'

type Props = {
  definition: ?LabwareDefinition2
  ingredNames: WellIngredientNames
  wellContents: ContentsByWell
}

export function BrowsableLabware(props: Props): React.Node {
  const { definition, ingredNames, wellContents } = props
  if (!definition) {
    assert(definition, 'BrowseLabwareModal expected definition')
    return null
  }

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
          wellFill={wellFillFromWellContents(wellContents)}
          highlightedWells={
            wellContents === null
              ? null
              : reduce(
                  wellContents,
                  (acc, _, wellName): WellGroup =>
                    tooltipWellName === wellName
                      ? { ...acc, [wellName]: null }
                      : acc,
                  {}
                )
          }
          onMouseEnterWell={({ event, wellName }) =>
            wellContents === null
              ? null
              : makeHandleMouseEnterWell(
                  wellName,
                  wellContents[wellName].ingreds
                )(event)
          }
          onMouseLeaveWell={handleMouseLeaveWell}
        />
      )}
    </WellTooltip>
  )
}
