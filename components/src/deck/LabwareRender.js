// @flow
// standalone render of a labware framed by a slot
// TODO IMMEDIATELY: separate out the flip from the rest of it all -> SlotView
import * as React from 'react'

import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import {
  WellLabels,
  WellStroke,
  WellFill,
  StaticLabware,
} from './labwareInternals'
import styles from './labwareRender.css' // TODO IMMEDIATELY: move to labwareInternals???

import type { LabwareDefinition2 } from '@opentrons/shared-data'

type Props = {
  definition: LabwareDefinition2,
  showLabels: boolean,
  missingTips?: Set<string>,
  highlightedWells?: Set<string>,
  /** CSS color to fill specified wells */
  wellFill?: { [wellName: string]: string },
  /** Optional callback, called with well name when that well is moused over */
  onMouseOverWell?: (wellName: string) => mixed,
  /** Special class which, together with 'data-wellname' on the well elements,
    allows drag-to-select behavior */
  selectableWellClass?: string,
}

export default function LabwareRender(props: Props) {
  // SVG coordinate system is flipped in Y from our robot coordinate system.
  // Note that this reflection via scaling happens via CSS on the SVG element,
  // not using `transform` attr on an element inside an SVG, so no translation is needed
  // and the robot X, Y points are preserved.
  const transform = `scale(1,-1)`
  const viewBox = `0 0 ${SLOT_RENDER_WIDTH} ${SLOT_RENDER_HEIGHT}`

  return (
    <svg
      className={styles.labware_render}
      viewBox={viewBox}
      style={{ transform }}
    >
      {/* NOTE: the selection stuff could get its own layer */}
      <StaticLabware
        definition={props.definition}
        onMouseOverWell={props.onMouseOverWell}
        selectableWellClass={props.selectableWellClass}
      />
      {props.wellFill && (
        <WellFill definition={props.definition} fillByWell={props.wellFill} />
      )}
      {props.highlightedWells && (
        <WellStroke
          strokeType="highlight"
          definition={props.definition}
          wells={props.highlightedWells}
        />
      )}
      {/* TODO IMMEDIATELY handle onMouseOverWell and selectableWellClass */}
      {props.showLabels && <WellLabels definition={props.definition} />}
    </svg>
  )
}
