import { useSelector } from 'react-redux'
import reduce from 'lodash/reduce'

import { WELL_LABEL_OPTIONS } from '@opentrons/components'
import { selectors } from '../../labware-ingred/selectors'
import { SingleLabware } from './SingleLabware'
import { wellFillFromWellContents } from './utils'
import type { WellGroup } from '@opentrons/components'
import type { ContentsByWell } from '../../labware-ingred/types'
import type { WellIngredientNames } from '../../steplist/types'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

import { WellTooltip } from './WellTooltip'

interface Props {
  definition?: LabwareDefinition2 | null
  ingredNames: WellIngredientNames
  wellContents: ContentsByWell
}

export function BrowsableLabware(props: Props): JSX.Element | null {
  const { definition, ingredNames, wellContents } = props
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  if (definition == null) {
    console.assert(definition, 'BrowseLabwareModal expected definition')
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
          wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
          wellFill={wellFillFromWellContents(wellContents, liquidDisplayColors)}
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
          onMouseEnterWell={({ event, wellName }) => {
            if (wellContents !== null)
              makeHandleMouseEnterWell(
                wellName,
                wellContents[wellName].ingreds
              )(event)
          }}
          onMouseLeaveWell={handleMouseLeaveWell}
        />
      )}
    </WellTooltip>
  )
}
