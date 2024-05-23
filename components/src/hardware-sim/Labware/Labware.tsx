import * as React from 'react'
import styled from 'styled-components'
import map from 'lodash/map'

import { COLORS } from '../../helix-design-system'

import {
  LabwareOutline,
  STYLE_BY_WELL_CONTENTS,
  StyledWells,
  Well,
  WellLabels,
} from './labwareInternals'
import { LabwareAdapter, labwareAdapterLoadNames } from './LabwareAdapter'

import type { CSSProperties } from 'styled-components'
import type { LabwareDefinition2, LabwareWell } from '@opentrons/shared-data'
import type {
  HighlightedWellLabels,
  WellMouseEvent,
  WellFill,
  WellStroke,
  WellGroup,
} from './labwareInternals/types'
import type { LabwareAdapterLoadName } from './LabwareAdapter'

const WELL_LABEL_OPTIONS = {
  SHOW_LABEL_INSIDE: 'SHOW_LABEL_INSIDE',
  SHOW_LABEL_OUTSIDE: 'SHOW_LABEL_OUTSIDE',
} as const

type WellLabelOption = keyof typeof WELL_LABEL_OPTIONS

export interface LabwareProps {
  /** Labware definition to render */
  definition: LabwareDefinition2
  /** Opional Prop for labware on heater shakers sitting on right side of the deck */
  shouldRotateAdapterOrientation?: boolean
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
  /** adds thicker blue border with blur to labware */
  highlight?: boolean
  /** Optional callback, called with WellMouseEvent args onMouseEnter */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  /** Optional callback, called with WellMouseEvent args onMouseLeave */
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  gRef?: React.RefObject<SVGGElement>
  onLabwareClick?: () => void
  /** Hide labware outline */
  hideOutline?: boolean
  /** Provides well data attribute */
  isInteractive?: boolean
}

const TipDecoration = React.memo(function TipDecoration(props: {
  well: LabwareWell
}) {
  const { well } = props
  if (well.shape === 'circular') {
    const radius = well.diameter / 2
    return (
      <circle
        {...STYLE_BY_WELL_CONTENTS.tipPresent}
        cx={well.x}
        cy={well.y}
        r={radius - 1}
      />
    )
  }
  return null
})

const LabwareDetailGroup = styled.g`
  fill: none;
  stroke: ${COLORS.black90};
  stroke-width: 1;
`

export const Labware = (props: LabwareProps): JSX.Element => {
  const {
    definition,
    gRef,
    hideOutline = false,
    highlight,
    isInteractive,
    onLabwareClick,
    onMouseEnterWell,
    onMouseLeaveWell,
    wellFill = {},
    wellStroke = {},
  } = props

  const cornerOffsetFromSlot = definition.cornerOffsetFromSlot
  const labwareLoadName = definition.parameters.loadName

  if (labwareAdapterLoadNames.includes(labwareLoadName)) {
    const { shouldRotateAdapterOrientation = false } = props
    const { xDimension, yDimension } = props.definition.dimensions

    return (
      <g
        transform={
          shouldRotateAdapterOrientation
            ? `rotate(180, ${xDimension / 2}, ${yDimension / 2})`
            : 'rotate(0, 0, 0)'
        }
      >
        <g
          transform={`translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`}
          ref={gRef}
        >
          <LabwareAdapter
            labwareLoadName={labwareLoadName as LabwareAdapterLoadName}
          />
        </g>
      </g>
    )
  }

  const { isTiprack } = definition.parameters

  return (
    <g
      transform={`translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`}
      ref={gRef}
    >
      <g onClick={onLabwareClick}>
        {!hideOutline ? (
          <LabwareDetailGroup>
            <LabwareOutline definition={definition} highlight={highlight} />
          </LabwareDetailGroup>
        ) : null}
        <g>
          {map(definition.wells, (well, wellName) => {
            return (
              <React.Fragment key={wellName}>
                <Well
                  wellName={wellName}
                  well={well}
                  onMouseEnterWell={onMouseEnterWell}
                  onMouseLeaveWell={onMouseLeaveWell}
                  isInteractive={isInteractive}
                  {...(isTiprack
                    ? STYLE_BY_WELL_CONTENTS.tipPresent
                    : STYLE_BY_WELL_CONTENTS.defaultWell)}
                  fill={wellFill[wellName]}
                  stroke={wellStroke[wellName]}
                />

                {isTiprack ? <TipDecoration well={well} /> : null}
              </React.Fragment>
            )
          })}
        </g>
      </g>
      {props.disabledWells != null
        ? props.disabledWells.map((well, index) => (
            <StyledWells
              key={index}
              wellContents="disabledWell"
              definition={props.definition}
              wells={well}
            />
          ))
        : null}
      {props.highlightedWells != null ? (
        <StyledWells
          wellContents="highlightedWell"
          definition={props.definition}
          wells={props.highlightedWells}
        />
      ) : null}
      {props.selectedWells != null ? (
        <StyledWells
          wellContents="selectedWell"
          definition={props.definition}
          wells={props.selectedWells}
        />
      ) : null}
      {props.missingTips != null ? (
        <StyledWells
          wellContents="tipMissing"
          definition={props.definition}
          wells={props.missingTips}
        />
      ) : null}
      {props.wellLabelOption != null &&
      props.definition.metadata.displayCategory !== 'adapter' ? (
        <WellLabels
          definition={props.definition}
          wellLabelOption={props.wellLabelOption}
          wellLabelColor={props.wellLabelColor}
          highlightedWellLabels={props.highlightedWellLabels}
        />
      ) : null}
    </g>
  )
}
