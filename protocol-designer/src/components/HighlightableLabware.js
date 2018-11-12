// @flow
// Wrap Plate with a SelectionRect.
import * as React from 'react'
import map from 'lodash/map'
import {
  getWellDefsForSVG,
  getLabware,
  getIsTiprack,
} from '@opentrons/shared-data'
import {
  Labware,
  Well,
  Tip,
  LabwareOutline,
  ingredIdsToColor,
} from '@opentrons/components'

import type {ContentsByWell} from '../labware-ingred/types'
import styles from './HighlightableLabware.css'

type LabwareProps = React.ElementProps<typeof Labware>

export type Props = {
  wellContents: ContentsByWell,
  getTipProps?: $PropertyType<LabwareProps, 'getTipProps'>,
  containerType: string,

  // used by container
  containerId?: string,
}

// TODO: BC 2018-10-08 we are only using this component in LabwareOnDeck,
// with no hover or select capabilities, pull out implicit highlighting
// labware into it's own component probably near to View Results' BrowsableLabware
export default function HighlightableLabware (props: Props) {
  const {wellContents, getTipProps, containerType} = props

  const allWellDefsByName = getWellDefsForSVG(containerType)
  const isTiprack = getIsTiprack(containerType)
  const labwareDefinition = getLabware(containerType)

  const tipVolume = labwareDefinition && labwareDefinition.metadata && labwareDefinition.metadata.tipVolume

  return (
    <g>
      <LabwareOutline className={isTiprack ? styles.tiprack_plate_outline : null}/>
      {map(wellContents, (well, wellName) => {
        if (isTiprack) {
          const tipProps = (getTipProps && getTipProps(wellName)) || {}
          return (
            <Tip
              key={wellName}
              wellDef={allWellDefsByName[wellName]}
              tipVolume={tipVolume}
              {...tipProps} />
          )
        } else {
          return (
            <Well
              key={wellName}
              wellName={wellName}
              highlighted={well.highlighted}
              selected={well.selected}
              fillColor={ingredIdsToColor(well.groupIds)}
              svgOffset={{x: 1, y: -3}}
              wellDef={allWellDefsByName[wellName]} />
          )
        }
      })}
    </g>
  )
}
