// @flow
import * as React from 'react'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import assert from 'assert'
import {
  getLabware,
  // getWellDefsForSVG,
  // getIsTiprackDeprecated,
} from '@opentrons/shared-data'

import LabwareOutline from './LabwareOutline'
import FallbackLabware from './FallbackLabware'
import Tip from './Tip'
import Well from './Well'
import styles from './Labware.css'

export type Props = {
  /** labware type, to get definition from shared-data */
  labwareType: string,
  definition: any, // TODO: definitions1 type
}

class Labware extends React.Component<Props> {
  render() {
    const { labwareType, definition } = this.props

    const labwareDefinition = definition || getLabware(labwareType)

    if (!labwareDefinition) {
      return <FallbackLabware />
    }

    const tipVolume =
      labwareDefinition.metadata && labwareDefinition.metadata.tipVolume

    const isTiprack =
      labwareDefinition.metadata && labwareDefinition.metadata.isTiprack

    return (
      <g>
        <LabwareOutline
          className={isTiprack ? styles.tiprack_plate_outline : null}
        />
        {map(labwareDefinition.wells, (wellDef, wellName) => {
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
              wellDef={{ ...wellDef, x: wellDef.x + 1, y: wellDef.y + 3 }} // This is a HACK to make the offset less "off"
            />
          )
        })}
      </g>
    )
  }
}

export default Labware
