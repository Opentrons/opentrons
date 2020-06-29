// @flow
import type { WellGroup } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import assert from 'assert'
import reduce from 'lodash/reduce'
import * as React from 'react'

import type { ContentsByWell } from '../../labware-ingred/types'
import type { WellIngredientNames } from '../../steplist/types'
import { SingleLabware } from './SingleLabware'
import { wellFillFromWellContents } from './utils'
import { WellTooltip } from './WellTooltip'

type Props = {|
  definition: ?LabwareDefinition2,
  ingredNames: WellIngredientNames,
  wellContents: ContentsByWell,
|}

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
          highlightedWells={reduce(
            wellContents,
            (acc, _, wellName): WellGroup =>
              tooltipWellName === wellName ? { ...acc, [wellName]: null } : acc,
            {}
          )}
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
