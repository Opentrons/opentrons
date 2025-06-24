import {
  getSchema2CornerOffsetFromSlot,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import { LabwareAdapter, labwareAdapterLoadNames } from './LabwareAdapter'
import {
  FilledWells,
  StaticLabware,
  StrokedWells,
  StyledWells,
  WellLabels,
} from './labwareInternals'

import type { CSSProperties } from 'styled-components'
import type { RefObject } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'
import type { LabwareAdapterLoadName } from './LabwareAdapter'
import type {
  HighlightedWellLabels,
  WellFill,
  WellGroup,
  WellMouseEvent,
  WellStroke,
} from './labwareInternals/types'

export const WELL_LABEL_OPTIONS = {
  SHOW_LABEL_INSIDE: 'SHOW_LABEL_INSIDE',
  SHOW_LABEL_OUTSIDE: 'SHOW_LABEL_OUTSIDE',
} as const

export type WellLabelOption = keyof typeof WELL_LABEL_OPTIONS

export interface LabwareRenderProps {
  /** Labware definition to render */
  definition: LabwareDefinition
  /**
   * How the rendered labware should be positioned. Use `passThrough` for new code.
   *
   * `passThrough` -
   *   The origin of the labware will be at the SVG origin. Beware that what
   *   "the origin of the labware" corresponds to, physically, is not consistent across
   *   labware. e.g. do not assume that it's always the labware's front-left corner.
   *
   *   To render a labware on its own, use the `getLabwareViewBox()` util from
   *   shared-data to compute the SVG's viewBox around that origin.
   *
   *   To render a labware aligned to something like a deck slot or module, wrap this
   *   component in an SVG transform. Use a util like shared-data's
   *   `getDeckSlotOriginToLabwareOrigin()` to compute it.
   *
   * `offsetInSlot` -
   *   The SVG origin will be treated as the origin of the slot enclosing the labware.
   *   The labware will be offset from that origin according to the labware def's
   *   cornerOffsetFromSlot.
   *
   *   To render a labware on its own, set the SVG viewBox's origin to
   *   definition.cornerOffsetFromSlot.
   *
   *   To render a labware aligned to something like a deck slot or module, wrap this
   *   component in an SVG transform that places the origin of this component at the
   *   origin of the slot.
   *
   *   This is deprecated because it relies on labware schema 2's slot-centric ideas of
   *   how labware are positioned. It's also clunky when rendering a labware on its
   *   own.
   */
  // todo(mm, 2025-06-09): Make this prop required after the dust settles on
  // v8.5.0/PD-v8.5.0 mergebacks, to force new callers to consider passThrough mode.
  // Remove uses of offsetInSlot mode as we're able, and delete it when none are left.
  positioningMode?: 'passThrough' | 'offsetInSlot'
  /**
   * Special handling for opentrons_universal_flat_adapter. Unlike other labware,
   * it rotates to match the underlying module, and that rotation actually matters
   * because it's asymmetrical.
   *
   * This should be true if this is that adapter and we're on the left side of the deck,
   * and false otherwise.
   *
   * Ignored if positioningMode is passThrough, in which case it's the caller's
   * responsibility to do this rotation.
   */
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
  /** adds a drop shadow to the highlight border */
  highlightShadow?: boolean
  /** Optional callback, called with WellMouseEvent args onMouseEnter */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  /** Optional callback, called with WellMouseEvent args onMouseLeave */
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  gRef?: RefObject<SVGGElement>
  onLabwareClick?: () => void
  showBorder?: boolean
  strokeColor?: string
}

export const LabwareRender = (props: LabwareRenderProps): JSX.Element => {
  const { gRef, definition, positioningMode = 'offsetInSlot' } = props

  const cornerOffsetFromSlot = getSchema2CornerOffsetFromSlot(definition)
  const labwareLoadName = definition.parameters.loadName
  const isAdapter = labwareAdapterLoadNames.includes(labwareLoadName)

  if (isAdapter) {
    const { shouldRotateAdapterOrientation } = props
    const { xDimension, yDimension } = getSchema2Dimensions(definition)

    return (
      <g
        transform={
          positioningMode === 'offsetInSlot' && shouldRotateAdapterOrientation
            ? `rotate(180, ${xDimension / 2}, ${yDimension / 2})`
            : undefined
        }
      >
        <g
          transform={
            positioningMode === 'offsetInSlot'
              ? shouldRotateAdapterOrientation
                ? `translate(${-cornerOffsetFromSlot.x}, ${-cornerOffsetFromSlot.y})`
                : `translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`
              : undefined
          }
          ref={gRef}
          onClick={props.onLabwareClick}
        >
          <LabwareAdapter
            labwareLoadName={labwareLoadName as LabwareAdapterLoadName}
            definition={definition}
            highlight={props.highlight}
            highlightShadow={props.highlightShadow}
          />
        </g>
      </g>
    )
  }
  return (
    <g
      transform={
        positioningMode === 'offsetInSlot'
          ? `translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`
          : undefined
      }
      ref={gRef}
    >
      <StaticLabware
        showBorder={props.showBorder}
        definition={props.definition}
        onMouseEnterWell={props.onMouseEnterWell}
        onMouseLeaveWell={props.onMouseLeaveWell}
        onLabwareClick={props.onLabwareClick}
        highlight={props.highlight}
        highlightShadow={props.highlightShadow}
        wellStroke={props.wellStroke}
      />
      {props.wellStroke != null ? (
        <StrokedWells
          definition={props.definition}
          strokeByWell={props.wellStroke}
        />
      ) : null}
      {props.wellFill != null ? (
        <FilledWells
          definition={props.definition}
          fillByWell={props.wellFill}
          strokeColor={props.strokeColor}
        />
      ) : null}
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
