import * as React from 'react'
import {
  WellLabels,
  StyledWells,
  FilledWells,
  StrokedWells,
  StaticLabware,
} from './labwareInternals'
import styles from './LabwareRender.css'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  HighlightedWellLabels,
  WellMouseEvent,
  WellFill,
  WellStroke,
  WellGroup,
} from './labwareInternals/types'
import type { CSSProperties } from 'styled-components'

export const WELL_LABEL_OPTIONS = {
  SHOW_LABEL_INSIDE: 'SHOW_LABEL_INSIDE',
  SHOW_LABEL_OUTSIDE: 'SHOW_LABEL_OUTSIDE',
} as const

export type WellLabelOption = keyof typeof WELL_LABEL_OPTIONS

export interface LabwareRenderProps {
  /** Labware definition to render */
  definition: LabwareDefinition2
  /** option to show well labels inside or outside of labware outline */
  wellLabelOption?: WellLabelOption
  /** wells to highlight */
  highlightedWells?: WellGroup | null
  /** option for none highlighted wells to be disabled */
  disabledWells?: WellGroup[]
  missingTips?: WellGroup | null
  /** color to render well labels */
  wellLabelColor?: string
  /** option to highlight well labels with specified color */
  highlightedWellLabels?: HighlightedWellLabels
  selectedWells?: WellGroup | null
  /** CSS color to fill specified wells */
  wellFill?: WellFill
  /** CSS color to stroke specified wells */
  wellStroke?: WellStroke
  /** CSS color to stroke the labware outline */
  labwareStroke?: CSSProperties['stroke']
  /** Optional callback, called with WellMouseEvent args onMouseEnter */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  /** Optional callback, called with WellMouseEvent args onMouseLeave */
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  /** Special class which, together with 'data-wellname' on the well elements,
    allows drag-to-select behavior */
  selectableWellClass?: string
  gRef?: React.RefObject<SVGGElement>
  // adds blue border with drop shadow to labware
  hover?: boolean
  onLabwareClick?: () => void
  highlightLabware?: boolean
  /** This will be used for displaying outline of labware */
  isOnDevice?: boolean
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
        hover={props.hover}
        onLabwareClick={props.onLabwareClick}
        highlightLabware={props.highlightLabware}
        isOnDevice={props.isOnDevice}
      />
      {props.wellStroke && (
        <StrokedWells
          definition={props.definition}
          strokeByWell={props.wellStroke}
        />
      )}
      {props.wellFill && (
        <FilledWells
          definition={props.definition}
          fillByWell={props.wellFill}
        />
      )}
      {props.disabledWells != null
        ? props.disabledWells.map((well, index) => (
            <StyledWells
              key={index}
              className={styles.disabled_well}
              definition={props.definition}
              wells={well}
            />
          ))
        : null}
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
      {props.wellLabelOption &&
        props.definition.metadata.displayCategory !== 'adapter' && (
          <WellLabels
            definition={props.definition}
            wellLabelOption={props.wellLabelOption}
            wellLabelColor={props.wellLabelColor}
            highlightedWellLabels={props.highlightedWellLabels}
          />
        )}
    </g>
  )
}
