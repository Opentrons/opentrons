import * as React from 'react'
import {
  WellLabels,
  StyledWells,
  FilledWells,
  StaticLabware,
} from './labwareInternals'
import styles from './LabwareRender.css'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  WellMouseEvent,
  WellFill,
  WellGroup,
} from './labwareInternals/types'

export interface LabwareRenderProps {
  definition: LabwareDefinition2
  showLabels?: boolean
  missingTips?: WellGroup | null | undefined
  highlightedWells?: WellGroup | null | undefined
  selectedWells?: WellGroup | null | undefined
  /** CSS color to fill specified wells */
  wellFill?: WellFill
  /** Optional callback, called with WellMouseEvent args onMouseEnter */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  /** Optional callback, called with WellMouseEvent args onMouseLeave */
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  /** Special class which, together with 'data-wellname' on the well elements,
    allows drag-to-select behavior */
  selectableWellClass?: string
  gRef?: React.RefObject<SVGGElement>
}

export const LabwareRender = (props: LabwareRenderProps): JSX.Element => {
  const { gRef } = props
  const cornerOffsetFromSlot = props.definition.cornerOffsetFromSlot

  return (
    <g
      transform={`translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`}
      ref={gRef}
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
