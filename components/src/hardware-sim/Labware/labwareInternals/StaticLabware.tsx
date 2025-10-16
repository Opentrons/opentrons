// Render labware definition to SVG. XY is in robot coordinates.
import { Fragment, memo } from 'react'
import flatMap from 'lodash/flatMap'
import styled from 'styled-components'

import { COLORS } from '../../../helix-design-system'
import { LabwareOutline } from './LabwareOutline'
import { STYLE_BY_WELL_CONTENTS } from './StyledWells'
import { TipStatus } from './Tips'
import { Well } from './Well'

import type { CSSProperties } from 'styled-components'
import type { MemoExoticComponent } from 'react'
import type { LabwareDefinition, LabwareWell } from '@opentrons/shared-data'
import type { TipType, WellMouseEvent, WellStroke } from './types'

export interface StaticLabwareProps {
  /** Labware definition to render */
  definition: LabwareDefinition
  /** Add thicker blurred blue border to labware, defaults to false */
  highlight?: boolean
  /** adds a drop shadow to the highlight border */
  highlightShadow?: boolean
  /** Optional callback to be executed when entire labware element is clicked */
  onLabwareClick?: () => void
  /** Optional callback to be executed when mouse enters a well element */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  /** Optional callback to be executed when mouse leaves a well element */
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  fill?: CSSProperties['fill']
  showRadius?: boolean
  wellStroke?: WellStroke
  /** optional show of labware border, defaulted to true */
  showBorder?: boolean
  tipStatusByWellName?: Record<string, TipType>
  handleClickWell?: (wellName: string) => void
  selectedTipsByIndex?: Record<string, number>
}

const TipDecoration = memo(function TipDecoration(props: {
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

export function StaticLabwareComponent(props: StaticLabwareProps): JSX.Element {
  const {
    definition,
    highlight,
    highlightShadow,
    onLabwareClick,
    onMouseEnterWell,
    onMouseLeaveWell,
    fill,
    showRadius = true,
    wellStroke = {},
    showBorder = true,
    tipStatusByWellName,
    handleClickWell,
    selectedTipsByIndex,
  } = props
  const { isTiprack } = definition.parameters
  return (
    <g onClick={onLabwareClick}>
      {!showBorder ? null : (
        <LabwareDetailGroup>
          <LabwareOutline
            definition={definition}
            highlight={highlight}
            highlightShadow={highlightShadow}
            fill={fill}
            showRadius={showRadius}
          />
        </LabwareDetailGroup>
      )}
      <g>
        {flatMap(
          definition.ordering,
          (row: string[], i: number, c: string[][]) => {
            return row.map(wellName => {
              const well = definition.wells[wellName]
              const wellWidth =
                well.shape === 'circular' ? well.diameter : well.xDimension
              const wellHeight =
                well.shape === 'circular' ? well.diameter : well.yDimension
              return (
                <Fragment key={wellName}>
                  {tipStatusByWellName == null ? (
                    <>
                      <Well
                        wellName={wellName}
                        well={well}
                        onMouseEnterWell={onMouseEnterWell}
                        onMouseLeaveWell={onMouseLeaveWell}
                        {...(isTiprack
                          ? STYLE_BY_WELL_CONTENTS.tipPresent
                          : STYLE_BY_WELL_CONTENTS.defaultWell)}
                        fill={fill}
                        stroke={wellStroke[wellName] ?? undefined}
                      />

                      {isTiprack ? (
                        <TipDecoration well={definition.wells[wellName]} />
                      ) : null}
                    </>
                  ) : (
                    <svg
                      x={well.x - wellWidth / 2}
                      y={well.y - wellHeight / 2}
                      onMouseEnter={e =>
                        onMouseEnterWell?.({ wellName, event: e })
                      }
                      onMouseLeave={e =>
                        onMouseLeaveWell?.({ wellName, event: e })
                      }
                      onClick={() => handleClickWell?.(wellName)} // TODO: add select logic
                    >
                      <TipStatus
                        type={tipStatusByWellName[wellName]}
                        text={
                          selectedTipsByIndex != null &&
                          wellName in selectedTipsByIndex
                            ? (selectedTipsByIndex[wellName] + 1).toString()
                            : undefined
                        }
                        size={`${wellWidth}px`} // wellWidth for tips will equal wellHeight, so using width here is arbitrary
                      />
                    </svg>
                  )}
                </Fragment>
              )
            })
          }
        )}
      </g>
    </g>
  )
}

export const StaticLabware: MemoExoticComponent<typeof StaticLabwareComponent> =
  memo(StaticLabwareComponent)
