import {
  getSchema2CornerOffsetFromSlot,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import { customSVGLoadNames, LabwareAdapter } from './LabwareAdapter'
import {
  FilledWells,
  StaticLabware,
  StrokedWells,
  StyledWells,
  WellLabels,
} from './labwareInternals'

import type { CSSProperties, ReactNode, RefObject } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'
import type { LabwareAdapterLoadName } from './LabwareAdapter'
import type { TipType, WellType } from './labwareInternals/types'
import type {
  HighlightedWellLabels,
  WELL_LABEL_OPTIONS,
  WellFillByName,
  WellGroup,
  WellMouseEvent,
  WellStrokeByName,
} from './labwareInternals/Wells'

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
  // todo(mm, 2025-06-09):
  // Remove uses of offsetInSlot mode as we're able, and delete it when none are left.
  positioningMode: 'passThrough' | 'offsetInSlot'
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
  wellFill?: WellFillByName
  /** CSS color to stroke specified wells */
  wellStroke?: WellStrokeByName
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
  statusByWellName?: Record<string, TipType | WellType>
  handleClickWell?: (wellName: string) => void
  selectedTipsByIndex?: Record<string, number>
  fill?: CSSProperties['fill']
}

export const LabwareRender = (props: LabwareRenderProps): ReactNode => {
  const {
    gRef,
    definition,
    positioningMode,
    onLabwareClick,
    highlight,
    highlightShadow,
    showBorder,
    onMouseEnterWell,
    onMouseLeaveWell,
    wellStroke,
    wellFill,
    strokeColor,
    wellLabelOption,
    wellLabelColor,
    highlightedWellLabels,
    selectedWells,
    missingTips,
    statusByWellName,
    handleClickWell,
    selectedTipsByIndex,
    disabledWells,
    highlightedWells,
    fill,
    labwareStroke,
  } = props

  const cornerOffsetFromSlot = getSchema2CornerOffsetFromSlot(definition)
  const labwareLoadName = definition.parameters.loadName
  const isNeedingCustomSVG = customSVGLoadNames.includes(labwareLoadName)
  const isLid = definition.allowedRoles?.includes('lid')

  if (isNeedingCustomSVG || isLid) {
    const { shouldRotateAdapterOrientation } = props
    const { xDimension, yDimension } = getSchema2Dimensions(definition)
    const lidDimensions =
      'dimensions' in definition ? definition.dimensions : null

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
          onClick={onLabwareClick}
        >
          <LabwareAdapter
            labwareLoadName={labwareLoadName as LabwareAdapterLoadName}
            definition={definition}
            highlight={highlight}
            highlightShadow={highlightShadow}
            isLid={isLid}
            lidDimensions={lidDimensions}
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
        showBorder={showBorder}
        definition={definition}
        onMouseEnterWell={onMouseEnterWell}
        onMouseLeaveWell={onMouseLeaveWell}
        onLabwareClick={onLabwareClick}
        highlight={highlight}
        highlightShadow={highlightShadow}
        wellStroke={wellStroke}
        statusByWellName={statusByWellName}
        handleClickWell={handleClickWell}
        selectedTipsByIndex={selectedTipsByIndex}
        fill={fill}
        borderStroke={labwareStroke}
      />
      {wellStroke != null ? (
        <StrokedWells definition={definition} strokeByWell={wellStroke} />
      ) : null}
      {wellFill != null ? (
        <FilledWells
          definition={definition}
          fillByWell={wellFill}
          strokeColor={strokeColor}
        />
      ) : null}
      {disabledWells != null
        ? disabledWells.map((well, index) => (
            <StyledWells
              key={index}
              wellContents="disabledWell"
              definition={definition}
              wells={well}
            />
          ))
        : null}
      {highlightedWells != null ? (
        <StyledWells
          wellContents="highlightedWell"
          definition={definition}
          wells={highlightedWells}
        />
      ) : null}
      {selectedWells != null ? (
        <StyledWells
          wellContents="selectedWell"
          definition={definition}
          wells={selectedWells}
        />
      ) : null}
      {missingTips != null ? (
        <StyledWells
          wellContents="tipMissing"
          definition={definition}
          wells={missingTips}
        />
      ) : null}
      {wellLabelOption != null &&
      definition.metadata.displayCategory !== 'adapter' ? (
        <WellLabels
          definition={definition}
          wellLabelOption={wellLabelOption}
          wellLabelColor={wellLabelColor}
          highlightedWellLabels={highlightedWellLabels}
        />
      ) : null}
    </g>
  )
}
