import { COLORS, LabwareOutline } from '@opentrons/components'
import {
  SLOT_LENGTH_MM as DEFAULT_X_DIMENSION,
  SLOT_WIDTH_MM as DEFAULT_Y_DIMENSION,
} from '@opentrons/shared-data'

import styles from './labwaresideview.module.css'
import { MissingInfoPlaceholder } from './MissingInfoPlaceholder'

import type {
  LabwareDefinition2,
  LabwareWell,
  WellBottomShape,
} from '@opentrons/shared-data'

interface Props {
  definition: LabwareDefinition2 | null
}

const OUTLINE_STROKE_WIDTH = 2
const INNER_STROKE_WIDTH = 1

const OUTLINE_STROKE = {
  stroke: COLORS.black90,
  strokeWidth: OUTLINE_STROKE_WIDTH,
  vectorEffect: 'non-scaling-stroke' as const,
}

const INNER_STROKE = {
  stroke: COLORS.grey40,
  strokeWidth: INNER_STROKE_WIDTH,
  vectorEffect: 'non-scaling-stroke' as const,
}

/** Relative sizing for geometry that isn't driven by real labware mm. */
const FONT_SIZE_FROM_HEIGHT_RATIO = 0.16
const FONT_SIZE_FROM_WIDTH_RATIO = 0.028
const SKIRT_OVERHANG_FROM_WIDTH_RATIO = 0.035
const SKIRT_OVERHANG_FROM_FONT_RATIO = 0.8
const MOUTH_DEPTH_FROM_HEIGHT_RATIO = 0.08
const MOUTH_DEPTH_FROM_FONT_RATIO = 0.9
const WELL_BODY_WIDTH_RATIO = 0.72
const MIN_VISIBLE_SEGMENT_MM = 0.2
const V_TIP_POINT_HEIGHT_RATIO = 0.35
const V_TIP_POINT_WIDTH_RATIO = 0.55
const U_TIP_RADIUS_HEIGHT_RATIO = 0.85
const U_TIP_FULL_ARC_TOLERANCE_MM = 0.05

export function LabwareSideView(props: Props): JSX.Element {
  const { definition } = props
  const referenceWell =
    definition == null
      ? null
      : (definition.wells.A1 ?? Object.values(definition.wells)[0])

  if (
    definition == null ||
    referenceWell == null ||
    definition.dimensions.xDimension <= 0 ||
    definition.dimensions.zDimension <= 0
  ) {
    return <SideViewPlaceholder />
  }

  const { xDimension, zDimension } = definition.dimensions
  const skirtHeight = definition.skirtHeight ?? 0
  const wellsBelowBody =
    skirtHeight > 0 ? Math.max(0, zDimension - skirtHeight) : 0
  const fontSize = Math.max(
    zDimension * FONT_SIZE_FROM_HEIGHT_RATIO,
    xDimension * FONT_SIZE_FROM_WIDTH_RATIO
  )
  const pad = fontSize
  const viewBox = `${-pad} ${-pad} ${xDimension + pad * 2} ${
    zDimension + pad * 2
  }`

  return (
    <svg
      className={styles.side_view}
      viewBox={viewBox}
      role="img"
      aria-label="Side view"
    >
      <g transform={`translate(0 ${zDimension}) scale(1 -1)`}>
        <PlateProfile
          definition={definition}
          skirtHeight={skirtHeight}
          wellsBelowBody={wellsBelowBody}
          wellBottomZ={referenceWell.z}
          fontSize={fontSize}
        />
      </g>
    </svg>
  )
}

function SideViewPlaceholder(): JSX.Element {
  return (
    <MissingInfoPlaceholder>
      <svg
        className={styles.side_view}
        viewBox={`0 0 ${DEFAULT_X_DIMENSION} ${DEFAULT_Y_DIMENSION}`}
        role="img"
        aria-label="Side view"
      >
        <LabwareOutline
          minX={0}
          minY={0}
          width={DEFAULT_X_DIMENSION}
          height={DEFAULT_Y_DIMENSION}
        />
      </svg>
    </MissingInfoPlaceholder>
  )
}

function PlateProfile(props: {
  definition: LabwareDefinition2
  skirtHeight: number
  wellsBelowBody: number
  wellBottomZ: number
  fontSize: number
}): JSX.Element {
  const { definition, skirtHeight, wellsBelowBody, wellBottomZ, fontSize } =
    props
  const { xDimension, zDimension } = definition.dimensions
  const wells = Object.values(definition.wells)
  const skirtTop =
    skirtHeight > 0
      ? Math.min(zDimension, wellsBelowBody + skirtHeight)
      : wellsBelowBody
  const skirtOverhang = Math.min(
    xDimension * SKIRT_OVERHANG_FROM_WIDTH_RATIO,
    fontSize * SKIRT_OVERHANG_FROM_FONT_RATIO
  )
  const mouthDepth = Math.min(
    zDimension * MOUTH_DEPTH_FROM_HEIGHT_RATIO,
    fontSize * MOUTH_DEPTH_FROM_FONT_RATIO
  )
  const bottomShape = getWellBottomShape(definition)
  // Material under the inside bottom, only drawn when wells hang past the skirt.
  const tipBelowWell = wellsBelowBody > 0 ? wellBottomZ : 0

  return (
    <>
      {tipBelowWell > 0
        ? wells.map(well => (
            <HangingWell
              key={`nozzle-${wellNameKey(well)}`}
              well={well}
              hangLength={tipBelowWell}
              bottomShape={bottomShape}
            />
          ))
        : null}
      {wellsBelowBody > tipBelowWell
        ? wells.map(well =>
            tipBelowWell > 0 ? (
              <OpenWell
                key={`open-${wellNameKey(well)}`}
                well={well}
                bottom={tipBelowWell}
                top={wellsBelowBody}
              />
            ) : (
              <HangingWell
                key={`hang-${wellNameKey(well)}`}
                well={well}
                hangLength={wellsBelowBody}
                bottomShape={bottomShape}
              />
            )
          )
        : null}
      {wellsBelowBody === 0
        ? wells.map(well => (
            <WellTip
              key={`tip-${wellNameKey(well)}`}
              well={well}
              skirtTop={skirtTop}
              bottomShape={bottomShape}
            />
          ))
        : null}
      {skirtHeight > 0 ? (
        <rect
          x={-skirtOverhang}
          y={wellsBelowBody}
          width={xDimension + skirtOverhang * 2}
          height={Math.max(skirtTop - wellsBelowBody, 0)}
          fill={COLORS.white}
          {...OUTLINE_STROKE}
        />
      ) : null}
      <rect
        x={0}
        y={skirtTop}
        width={xDimension}
        height={Math.max(zDimension - skirtTop, 0)}
        fill={COLORS.white}
        {...OUTLINE_STROKE}
      />
      {wells.map(well => (
        <WellMouth
          key={`mouth-${wellNameKey(well)}`}
          well={well}
          plateTop={zDimension}
          mouthDepth={mouthDepth}
        />
      ))}
    </>
  )
}

function OpenWell(props: {
  well: LabwareWell
  bottom: number
  top: number
}): JSX.Element | null {
  const { well, bottom, top } = props
  if (top - bottom <= MIN_VISIBLE_SEGMENT_MM) {
    return null
  }
  const width = getWellXSize(well) * WELL_BODY_WIDTH_RATIO
  return (
    <rect
      x={well.x - width / 2}
      y={bottom}
      width={width}
      height={top - bottom}
      fill={COLORS.white}
      {...INNER_STROKE}
    />
  )
}

function HangingWell(props: {
  well: LabwareWell
  hangLength: number
  bottomShape: WellBottomShape
}): JSX.Element {
  const { well, hangLength, bottomShape } = props
  const width = getWellXSize(well) * WELL_BODY_WIDTH_RATIO
  const left = well.x - width / 2
  const right = well.x + width / 2
  const tipProps = {
    fill: COLORS.white,
    'data-testid': `well-tip-${bottomShape}`,
    ...INNER_STROKE,
  }
  if (bottomShape === 'flat') {
    return (
      <rect x={left} y={0} width={width} height={hangLength} {...tipProps} />
    )
  }
  return (
    <path
      d={tipPath(bottomShape, left, right, well.x, 0, hangLength)}
      {...tipProps}
    />
  )
}

function WellMouth(props: {
  well: LabwareWell
  plateTop: number
  mouthDepth: number
}): JSX.Element {
  const { well, plateTop, mouthDepth } = props
  const width = getWellXSize(well)
  const depth = Math.min(mouthDepth, well.depth)
  return (
    <rect
      x={well.x - width / 2}
      y={plateTop - depth}
      width={width}
      height={depth}
      fill={COLORS.white}
      {...INNER_STROKE}
    />
  )
}

function WellTip(props: {
  well: LabwareWell
  skirtTop: number
  bottomShape: WellBottomShape
}): JSX.Element | null {
  const { well, skirtTop, bottomShape } = props
  if (skirtTop - well.z <= MIN_VISIBLE_SEGMENT_MM) {
    return null
  }
  const width = getWellXSize(well) * WELL_BODY_WIDTH_RATIO
  const left = well.x - width / 2
  const right = well.x + width / 2
  const tipProps = {
    fill: COLORS.white,
    'data-testid': `well-tip-${bottomShape}`,
    ...INNER_STROKE,
  }
  if (bottomShape === 'flat') {
    return (
      <rect
        x={left}
        y={well.z}
        width={width}
        height={skirtTop - well.z}
        {...tipProps}
      />
    )
  }
  return (
    <path
      d={tipPath(bottomShape, left, right, well.x, well.z, skirtTop)}
      {...tipProps}
    />
  )
}

function tipPath(
  shape: Exclude<WellBottomShape, 'flat'>,
  left: number,
  right: number,
  center: number,
  bottom: number,
  top: number
): string {
  const height = top - bottom
  if (shape === 'v') {
    const pointStart =
      bottom +
      Math.min(
        height,
        Math.max(
          height * V_TIP_POINT_HEIGHT_RATIO,
          (right - left) * V_TIP_POINT_WIDTH_RATIO
        )
      )
    return `M ${left} ${top} L ${left} ${pointStart} L ${center} ${bottom} L ${right} ${pointStart} L ${right} ${top} Z`
  }
  const radius = Math.min(
    (right - left) / 2,
    height * U_TIP_RADIUS_HEIGHT_RATIO
  )
  if (radius >= height - U_TIP_FULL_ARC_TOLERANCE_MM) {
    return `M ${left} ${top} Q ${center} ${bottom} ${right} ${top} Z`
  }
  return `M ${left} ${top} L ${left} ${bottom + radius} Q ${center} ${bottom} ${right} ${bottom + radius} L ${right} ${top} Z`
}

function getWellBottomShape(definition: LabwareDefinition2): WellBottomShape {
  return (
    definition.groups.find(group => group.metadata.wellBottomShape != null)
      ?.metadata.wellBottomShape ?? 'flat'
  )
}

function getWellXSize(well: LabwareWell): number {
  return well.shape === 'circular' ? well.diameter : well.xDimension
}

function wellNameKey(well: LabwareWell): string {
  return `${well.x}-${well.y}-${well.z}`
}
