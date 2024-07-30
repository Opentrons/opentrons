import * as React from 'react'
import { WellLabels, StaticLabware } from './labwareInternals'
import { LabwareAdapter } from './LabwareAdapter'
import { COLORS } from '../../helix-design-system'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { HighlightedWellLabels } from './labwareInternals/types'
import type { LabwareAdapterLoadName } from './LabwareAdapter'

export const WELL_LABEL_OPTIONS = {
  SHOW_LABEL_INSIDE: 'SHOW_LABEL_INSIDE',
  SHOW_LABEL_OUTSIDE: 'SHOW_LABEL_OUTSIDE',
} as const

export type WellLabelOption = keyof typeof WELL_LABEL_OPTIONS

const HIGHLIGHT_COLOR = COLORS.blue30
const STROKE_WIDTH = 1
const SKEW_ANGLE_DEGREES = 30
const SKEW_ANGLE_RADIANS = (SKEW_ANGLE_DEGREES * Math.PI) / 180
const COSINE_SKEW_ANGLE = Math.cos(SKEW_ANGLE_RADIANS)

export interface LabwareRenderProps {
  /** Labware definitions in stack to render */
  definitionTop: LabwareDefinition2
  /** option to highlight well labels with specified color */
  highlightedWellLabels?: HighlightedWellLabels
  /** highlight top labware */
  highlightTop: boolean
  /** highlight bottom labware if it exists */
  highlightBottom: boolean
  gRef?: React.RefObject<SVGGElement>
  definitionBottom?: LabwareDefinition2
  shouldRotateAdapterOrientation?: boolean
  /** option to show well labels inside or outside of labware outline */
  wellLabelOption?: WellLabelOption
}

export const LabwareRender = (props: LabwareRenderProps): JSX.Element => {
  const {
    gRef,
    definitionTop,
    definitionBottom,
    highlightTop,
    wellLabelOption,
    shouldRotateAdapterOrientation,
    highlightBottom = false,
  } = props

  const labwareLoadNameTop = definitionTop.parameters.loadName
  const fillColorTop = highlightTop ? HIGHLIGHT_COLOR : COLORS.white
  const fillColorBottom = highlightBottom ? HIGHLIGHT_COLOR : COLORS.white

  // only one labware (top)
  if (definitionBottom == null) {
    const { xDimension, yDimension } = definitionTop.dimensions
    const isTopAdapter = definitionTop.metadata.displayCategory === 'adapter'

    return isTopAdapter ? (
      // adapter render
      <g
        transform={
          shouldRotateAdapterOrientation
            ? `rotate(180, ${xDimension / 2}, ${yDimension / 2})`
            : 'rotate(0, 0, 0)'
        }
      >
        <g>
          <LabwareAdapter
            labwareLoadName={labwareLoadNameTop as LabwareAdapterLoadName}
          />
        </g>
      </g>
    ) : (
      // isometric view of labware
      <svg>
        <g
          transform={`translate(55, 28) rotate(SKEW_ANGLE_DEGREES) skewX(-${SKEW_ANGLE_DEGREES}) scale(${COSINE_SKEW_ANGLE}, ${COSINE_SKEW_ANGLE})`}
          ref={gRef}
        >
          <StaticLabware definition={definitionTop} fill={fillColorBottom} />
          {wellLabelOption != null ? (
            <WellLabels
              definition={definitionTop}
              wellLabelOption={wellLabelOption}
              wellLabelColor={fillColorBottom}
              highlightedWellLabels={props.highlightedWellLabels}
            />
          ) : null}
        </g>
        <rect
          width={definitionTop.dimensions.yDimension - STROKE_WIDTH}
          height={definitionTop.dimensions.zDimension - STROKE_WIDTH}
          transform={`translate(55, 28) rotate(180) skewY(-${SKEW_ANGLE_DEGREES}) scale(${COSINE_SKEW_ANGLE}, ${COSINE_SKEW_ANGLE})`}
          strokeWidth={STROKE_WIDTH}
          stroke={COLORS.black90}
          fill={fillColorTop}
        />
        <rect
          width={definitionTop.dimensions.xDimension - STROKE_WIDTH}
          height={definitionTop.dimensions.zDimension - STROKE_WIDTH}
          transform={`translate(55, 28) skewY(${SKEW_ANGLE_DEGREES}) scale(${
            COSINE_SKEW_ANGLE * 0.5
          }, -${COSINE_SKEW_ANGLE}) `}
          strokeWidth={STROKE_WIDTH}
          stroke={COLORS.black90}
          fill={fillColorTop}
        />
      </svg>
    )
  }

  return (
    <svg>
      {/* bottom labware/adapter */}
      <g
        transform={`translate(55, ${
          28 - definitionTop.dimensions.zDimension * 0.5 - 10
        }) rotate(${SKEW_ANGLE_DEGREES}) skewX(-${SKEW_ANGLE_DEGREES}) scale(${COSINE_SKEW_ANGLE}, ${COSINE_SKEW_ANGLE})`}
        ref={gRef}
        fill={fillColorBottom}
      >
        <StaticLabware definition={definitionTop} fill={fillColorBottom} />
        {wellLabelOption != null &&
        definitionTop.metadata.displayCategory !== 'adapter' ? (
          <WellLabels
            definition={definitionTop}
            wellLabelOption={wellLabelOption}
            wellLabelColor={fillColorBottom}
            highlightedWellLabels={props.highlightedWellLabels}
          />
        ) : null}
      </g>
      <rect
        width={definitionTop.dimensions.yDimension - STROKE_WIDTH}
        height={definitionTop.dimensions.zDimension - STROKE_WIDTH}
        transform={`translate(55, ${
          28 - definitionTop.dimensions.zDimension * 0.5 - 10
        }) rotate(180) skewY(-${SKEW_ANGLE_DEGREES}) scale(${COSINE_SKEW_ANGLE}, ${COSINE_SKEW_ANGLE})`}
        strokeWidth={STROKE_WIDTH}
        stroke={COLORS.black90}
        fill={fillColorBottom}
      />
      <rect
        width={definitionTop.dimensions.xDimension - STROKE_WIDTH}
        height={definitionTop.dimensions.zDimension - STROKE_WIDTH}
        transform={`translate(55, ${
          28 - definitionTop.dimensions.zDimension * 0.5 - 10
        }) skewY(${SKEW_ANGLE_DEGREES}) scale(${
          COSINE_SKEW_ANGLE * 0.5
        }, -${COSINE_SKEW_ANGLE}) `}
        strokeWidth={STROKE_WIDTH}
        stroke={COLORS.black90}
        fill={fillColorBottom}
      />
      {/* top labware/adapter */}
      <g
        transform={`translate(55, 28) rotate(${SKEW_ANGLE_DEGREES}) skewX(-${SKEW_ANGLE_DEGREES}) scale(${COSINE_SKEW_ANGLE}, ${COSINE_SKEW_ANGLE})`}
        ref={gRef}
      >
        <StaticLabware definition={definitionTop} fill={fillColorTop} />
        {wellLabelOption != null &&
        definitionTop.metadata.displayCategory !== 'adapter' ? (
          <WellLabels
            definition={definitionTop}
            wellLabelOption={wellLabelOption}
            wellLabelColor={fillColorTop}
            highlightedWellLabels={props.highlightedWellLabels}
          />
        ) : null}
      </g>
      <rect
        width={definitionTop.dimensions.yDimension - STROKE_WIDTH}
        height={definitionTop.dimensions.zDimension - STROKE_WIDTH}
        transform={`translate(55, 28) rotate(180) skewY(-${SKEW_ANGLE_DEGREES}) scale(${COSINE_SKEW_ANGLE}, ${COSINE_SKEW_ANGLE})`}
        strokeWidth={STROKE_WIDTH}
        stroke={COLORS.black90}
        fill={fillColorTop}
      />
      <rect
        width={definitionTop.dimensions.xDimension - STROKE_WIDTH}
        height={definitionTop.dimensions.zDimension - STROKE_WIDTH}
        transform={`translate(55, 28) skewY(${SKEW_ANGLE_DEGREES}) scale(${
          COSINE_SKEW_ANGLE * 0.5
        }, -${COSINE_SKEW_ANGLE}) `}
        strokeWidth={STROKE_WIDTH}
        stroke={COLORS.black90}
        fill={fillColorTop}
      />
    </svg>
  )
}
