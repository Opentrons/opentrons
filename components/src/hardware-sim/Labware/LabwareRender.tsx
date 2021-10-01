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
  HighlightedWellLabels,
  WellMouseEvent,
  WellFill,
  WellGroup,
} from './labwareInternals/types'

export const WELL_LABEL_OPTIONS = {
  SHOW_LABEL_INSIDE: 'SHOW_LABEL_INSIDE',
  SHOW_LABEL_OUTSIDE: 'SHOW_LABEL_OUTSIDE',
} as const

export type WellLabelOption = keyof typeof WELL_LABEL_OPTIONS

export interface LabwareRenderProps {
  definition: LabwareDefinition2
  wellLabelOption?: WellLabelOption
  highlightedWells?: WellGroup
  missingTips?: WellGroup | null | undefined
  highlightedWellLabels?: HighlightedWellLabels
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
      {props.wellLabelOption && (
        <WellLabels
          definition={props.definition}
          wellLabelOption={props.wellLabelOption}
          highlightedWellLabels={props.highlightedWellLabels}
        />
      )}
    </g>
  )
}
