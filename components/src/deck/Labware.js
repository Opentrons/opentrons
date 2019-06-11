// @flow
import * as React from 'react'
import map from 'lodash/map'
import assert from 'assert'
import {
  getLabware,
  getWellDefsForSVG,
  getIsTiprackDeprecated,
} from '@opentrons/shared-data'

import LabwareOutline from './LabwareOutline'
import FallbackLabware from './FallbackLabware'
import Tip from './Tip'
import Well from './Well'
import styles from './Labware.css'

export type Props = {
  /** labware type, to get definition from shared-data */
  labwareType: string,
}

class Labware extends React.Component<Props> {
  render() {
    const { labwareType } = this.props

    const labwareDefinition = getLabware(labwareType)

    if (!getLabware(labwareType)) {
      return <FallbackLabware />
    }

    const tipVolume =
      labwareDefinition.metadata && labwareDefinition.metadata.tipVolume

    const allWells = getWellDefsForSVG(labwareType)
    const isTiprack = getIsTiprackDeprecated(labwareType)

    // TODO: Ian 2018-06-27 remove scale & transform so this offset isn't needed
    // Or... this is actually from the labware definitions?? But not tipracks?
    const svgOffset = { x: 1, y: -3 }
    return (
      <g>
        <LabwareOutline
          className={isTiprack ? styles.tiprack_plate_outline : null}
        />
        {map(allWells, (wellDef, wellName) => {
          assert(
            wellDef,
            `No well definition for labware ${labwareType}, well ${wellName}`
          )
          return isTiprack ? (
            <Tip key={wellName} wellDef={wellDef} tipVolume={tipVolume} />
          ) : (
            <Well
              key={wellName}
              wellName={wellName}
              {...{ wellDef, svgOffset }}
            />
          )
        })}
      </g>
    )
  }
}

export default Labware
