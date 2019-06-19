// @flow
import * as React from 'react'
import map from 'lodash/map'
import type { LabwareDefinition1 } from '@opentrons/shared-data'
import assert from 'assert'
import { getLabwareV1Def as getLabware } from '@opentrons/shared-data'

import LabwareOutline from './LabwareOutline'
import FallbackLabware from './FallbackLabware'
import Tip from './Tip'
import Well from './Well'
import styles from './Labware.css'

export type Props = {
  /** labware type, to get legacy definition from shared-data */
  labwareType?: string,
  definition?: ?LabwareDefinition1,
}

// NOTE: this is a legacy component that is only responsible
// for visualizing a labware schema v1 definition by def or loadName

class Labware extends React.Component<Props> {
  render() {
    const { labwareType, definition } = this.props

    const labwareDefinition =
      definition || (labwareType ? getLabware(labwareType) : null)

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
            `No well definition for labware ${labwareType ||
              'unknown labware'}, well ${wellName}`
          )
          // NOTE x + 1, y + 3 HACK offset from old getWellDefsForSVG has been purposefully
          // left out here; it's intention was to make the well viz offset less "off"
          return isTiprack ? (
            <Tip key={wellName} wellDef={wellDef} tipVolume={tipVolume} />
          ) : (
            <Well
              key={wellName}
              wellName={wellName}
              wellDef={{ ...wellDef, x: wellDef.x, y: wellDef.y }}
            />
          )
        })}
      </g>
    )
  }
}

export default Labware
