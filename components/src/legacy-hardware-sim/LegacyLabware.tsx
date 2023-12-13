// TODO(mc, 2020-02-19): still used but deprecated; remove when able
import * as React from 'react'
import map from 'lodash/map'
import assert from 'assert'
import cx from 'classnames'
import {
  SLOT_RENDER_WIDTH,
  SLOT_RENDER_HEIGHT,
  getLabwareV1Def as getLabware,
  wellIsRect,
} from '@opentrons/shared-data'
import type { LabwareDefinition1, WellDefinition } from '@opentrons/shared-data'
import { SELECTABLE_WELL_CLASS } from '../constants'

import labwareStyles from './Labware.module.css'
import wellStyles from './Well.module.css'

import { LabwareOutline, RobotCoordsForeignDiv } from '../hardware-sim'

export interface LabwareProps {
  /** labware type, to get legacy definition from shared-data */
  labwareType?: string
  definition?: LabwareDefinition1 | null | undefined
}

/**
 * This is a legacy component that is only responsible
 * for visualizing a labware schema v1 definition by def or loadName
 *
 * @deprecated Use {@link LabwareRender instead}
 */
export class LegacyLabware extends React.Component<LabwareProps> {
  render(): JSX.Element {
    const { labwareType, definition } = this.props

    const labwareDefinition =
      definition || (labwareType ? getLabware(labwareType) : null)

    if (!labwareDefinition) {
      return <FallbackLabware />
    }

    const tipVolume =
      labwareDefinition.metadata && labwareDefinition.metadata.tipVolume

    const isTiprack =
      labwareDefinition.metadata && labwareDefinition.metadata.isTiprack

    return (
      <g>
        <LabwareOutline
          width={SLOT_RENDER_WIDTH}
          height={SLOT_RENDER_HEIGHT}
          isTiprack={isTiprack}
        />
        {map(labwareDefinition.wells, (wellDef, wellName) => {
          assert(
            wellDef,
            `No well definition for labware ${
              labwareType || 'unknown labware'
            }, well ${wellName}`
          )
          // NOTE x + 1, y + 3 HACK offset from old getWellDefsForSVG has been purposefully
          // left out here; it's intention was to make the well viz offset less "off"
          return isTiprack ? (
            <Tip key={wellName} wellDef={wellDef} tipVolume={tipVolume} />
          ) : (
            <Well
              key={wellName}
              wellName={wellName}
              wellDef={{ ...wellDef, x: wellDef.x, y: wellDef.y }}
            />
          )
        })}
      </g>
    )
  }
}

// TODO: BC 2019-06-18 remove when old Labware component is no longer used anywhere
/**
 * @deprecated No longer necessary, do not use
 */
export function FallbackLabware(): JSX.Element {
  return (
    <g>
      <LabwareOutline width={SLOT_RENDER_WIDTH} height={SLOT_RENDER_HEIGHT} />
      <RobotCoordsForeignDiv
        width={SLOT_RENDER_WIDTH}
        height={SLOT_RENDER_HEIGHT}
        x={0}
        y={-SLOT_RENDER_HEIGHT}
        transformWithSVG
        innerDivProps={{
          className: labwareStyles.fallback_plate_text,
        }}
      >
        <p>Custom Labware</p>
      </RobotCoordsForeignDiv>
    </g>
  )
}

export interface TipProps {
  wellDef: WellDefinition
  tipVolume: number | null | undefined
  empty?: boolean | null | undefined
  highlighted?: boolean | null | undefined
}

/**
 * @deprecated No longer necessary, do not use
 */
export function Tip(props: TipProps): JSX.Element {
  const { wellDef, empty, highlighted, tipVolume } = props
  const circleProps = {
    cx: wellDef.x,
    cy: wellDef.y,
  }

  // TODO: Ian 2018-08-13 refine tip sizes for different tip racks
  let outerRadius = 3
  let innerRadius = 2

  if (typeof tipVolume === 'number' && tipVolume > 20) {
    outerRadius = 3.5
    innerRadius = 2.5
  }

  if (empty) {
    return (
      <circle
        {...circleProps}
        r={outerRadius}
        className={cx(wellStyles.empty_tip, wellStyles.tip_border)}
      />
    )
  }

  const outerCircleClassName = highlighted
    ? wellStyles.highlighted
    : wellStyles.tip_border

  return (
    <g>
      {/* Fill contents */}
      <circle
        {...circleProps}
        r={outerRadius}
        className={wellStyles.tip_fill}
      />
      {/* Outer circle */}
      <circle
        {...circleProps}
        r={outerRadius}
        className={outerCircleClassName}
      />
      {/* Inner circle */}
      <circle
        {...circleProps}
        r={innerRadius}
        className={wellStyles.tip_border}
      />
    </g>
  )
}

export interface SingleWell {
  wellName: string
  highlighted?: boolean | null | undefined // highlighted is the same as hovered
  selected?: boolean | null
  error?: boolean | null
  maxVolume?: number
  fillColor?: string | null
}

export interface WellProps extends SingleWell {
  selectable?: boolean
  wellDef: WellDefinition
  onMouseOver?: React.MouseEventHandler
  onMouseLeave?: React.MouseEventHandler
  onMouseMove?: React.MouseEventHandler
}

/**
 * @deprecated No longer necessary, do not use
 */
export class Well extends React.Component<WellProps> {
  shouldComponentUpdate(nextProps: WellProps): boolean {
    return (
      this.props.highlighted !== nextProps.highlighted ||
      this.props.selected !== nextProps.selected ||
      this.props.fillColor !== nextProps.fillColor
    )
  }

  render(): JSX.Element | null {
    const {
      wellName,
      selectable,
      highlighted,
      selected,
      error,
      wellDef,
      onMouseOver,
      onMouseLeave,
      onMouseMove,
    } = this.props

    const fillColor = this.props.fillColor || 'transparent'

    const wellOverlayClassname = cx(wellStyles.well_border, {
      [SELECTABLE_WELL_CLASS]: selectable,
      [wellStyles.selected]: selected,
      [wellStyles.selected_overlay]: selected,
      [wellStyles.highlighted]: highlighted,
      [wellStyles.error]: error,
    })

    const selectionProps = {
      'data-wellname': wellName,
      onMouseOver,
      onMouseLeave,
      onMouseMove,
    }

    const isRect = wellIsRect(wellDef)
    const isCircle = !isRect

    if (isRect) {
      const rectProps = {
        x: wellDef.x,
        y: wellDef.y,
        width: wellDef.width,
        height: wellDef.length,
      }

      return (
        <g>
          {/* Fill contents */}
          <rect
            {...rectProps}
            className={wellStyles.well_fill}
            color={fillColor}
          />
          {/* Border + overlay */}
          <rect
            {...selectionProps}
            {...rectProps}
            className={wellOverlayClassname}
          />
        </g>
      )
    }

    if (isCircle) {
      const circleProps = {
        cx: wellDef.x,
        cy: wellDef.y,
        r: (wellDef.diameter || 0) / 2,
      }

      return (
        <g>
          {/* Fill contents */}
          <circle
            {...circleProps}
            className={wellStyles.well_fill}
            color={fillColor}
          />
          {/* Border + overlay */}
          <circle
            {...selectionProps}
            {...circleProps}
            className={wellOverlayClassname}
          />
        </g>
      )
    }

    console.warn(
      'Invalid well: neither rectangle or circle: ' + JSON.stringify(wellDef)
    )
    return null
  }
}
