// @flow
import * as React from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import {
  WellLabels,
  StyledWells,
  FilledWells,
  StaticLabware,
} from './labwareInternals'
import styles from './LabwareRender.css'

import type {
  WellMouseEvent,
  WellFill,
  WellGroup,
} from './labwareInternals/types'

export type LabwareRenderProps = {|
  definition: LabwareDefinition2,
  showLabels?: boolean,
  missingTips?: WellGroup,
  highlightedWells?: WellGroup,
  selectedWells?: WellGroup,
  /** CSS color to fill specified wells */
  wellFill?: WellFill,
  /** Optional callback, called with WellMouseEvent args onMouseEnter */
  onMouseEnterWell?: WellMouseEvent => mixed,
  /** Optional callback, called with WellMouseEvent args onMouseLeave */
  onMouseLeaveWell?: WellMouseEvent => mixed,
  /** Special class which, together with 'data-wellname' on the well elements,
    allows drag-to-select behavior */
  selectableWellClass?: string,
|}

export function LabwareRender(props: LabwareRenderProps): React.Node {
  const cornerOffsetFromSlot = props.definition.cornerOffsetFromSlot
  return (
    <g
      transform={`translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`}
    >
      <StaticLabware
        definition={props.definition}
        onMouseEnterWell={props.onMouseEnterWell}
        onMouseLeaveWell={props.onMouseLeaveWell}
        selectableWellClass={props.selectableWellClass}
      />
      {props.wellFill && (
        <FilledWells
          definition={props.definition}
          fillByWell={props.wellFill}
        />
      )}
      {props.highlightedWells && (
        <StyledWells
          className={styles.highlighted_well}
          definition={props.definition}
          wells={props.highlightedWells}
        />
      )}
      {props.selectedWells && (
        <StyledWells
          className={styles.selected_well}
          definition={props.definition}
          wells={props.selectedWells}
        />
      )}
      {props.missingTips && (
        <StyledWells
          className={styles.missing_tip}
          definition={props.definition}
          wells={props.missingTips}
        />
      )}
      {props.showLabels && <WellLabels definition={props.definition} />}
    </g>
  )
}
