import * as React from 'react'
import styled from 'styled-components'
import flatMap from 'lodash/flatMap'
import { animated, useSpring, easings } from '@react-spring/web'
import {
  LabwareWell,
  LoadedModule,
  getDeckDefFromRobotType,
  getModuleDef2,
} from '@opentrons/shared-data'

import type {
  Coordinates,
  LabwareDefinition2,
  LabwareLocation,
  RobotType,
  DeckSlot,
  DeckDefinition,
} from '@opentrons/shared-data'
import { IDENTITY_AFFINE_TRANSFORM, multiplyMatrices } from '../utils'
import { DeckFromData } from './DeckFromData'
import { StyleProps } from '../../primitives'
import { COLORS } from '../../ui-style-constants'

function getLabwareCoordinates({
  orderedSlots,
  location,
  deckId,
  loadedModules,
}: {
  orderedSlots: DeckSlot[]
  location: LabwareLocation
  deckId: DeckDefinition['otId']
  loadedModules: LoadedModule[]
}): Coordinates | null {
  if (location === 'offDeck') {
    return null
  } else if ('slotName' in location) {
    const slotCoordinateTuple =
      orderedSlots.find(s => s.id === location.slotName)?.position ?? null
    return slotCoordinateTuple != null
      ? {
          x: slotCoordinateTuple[0],
          y: slotCoordinateTuple[1],
          z: slotCoordinateTuple[2],
        }
      : null
  } else {
    const loadedModule = loadedModules.find(m => m.id === location.moduleId)
    if (loadedModule == null) return null
    const modSlot = orderedSlots.find(
      s => s.id === loadedModule.location.slotName
    )
    if (modSlot == null) return null
    const [modX, modY] = modSlot.position
    const deckSpecificAffineTransform =
      getModuleDef2(loadedModule.model).slotTransforms?.[deckId]?.[modSlot.id]
        ?.labwareOffset ?? IDENTITY_AFFINE_TRANSFORM
    const [[labwareX], [labwareY], [labwareZ]] = multiplyMatrices(
      [[modX], [modY], [1], [1]],
      deckSpecificAffineTransform
    )
    return { x: labwareX, y: labwareY, z: labwareZ }
  }
}

const OUTLINE_THICKNESS_MM = 3
const SPLASH_Y_BUFFER_MM = 10

interface MoveLabwareOnDeckProps extends StyleProps {
  robotType: RobotType
  movedLabwareDef: LabwareDefinition2
  initialLabwareLocation: LabwareLocation
  finalLabwareLocation: LabwareLocation
  loadedModules: LoadedModule[]
  backgroundItems?: React.ReactNode
}
export function MoveLabwareOnDeck(
  props: MoveLabwareOnDeckProps
): JSX.Element | null {
  const {
    robotType,
    movedLabwareDef,
    initialLabwareLocation,
    finalLabwareLocation,
    loadedModules,
    backgroundItems = null,
    ...styleProps
  } = props
  const deckDef = React.useMemo(() => getDeckDefFromRobotType(robotType), [
    robotType,
  ])

  const offDeckPosition = {
    x: deckDef.locations.orderedSlots[1].position[0],
    y:
      deckDef.cornerOffsetFromOrigin[1] -
      movedLabwareDef.dimensions.xDimension -
      SPLASH_Y_BUFFER_MM,
  }
  const initialPosition =
    getLabwareCoordinates({
      orderedSlots: deckDef.locations.orderedSlots,
      location: initialLabwareLocation,
      loadedModules,
      deckId: deckDef.otId,
    }) ?? offDeckPosition
  const finalPosition =
    getLabwareCoordinates({
      orderedSlots: deckDef.locations.orderedSlots,
      location: finalLabwareLocation,
      loadedModules,
      deckId: deckDef.otId,
    }) ?? offDeckPosition

  const springProps = useSpring({
    config: { duration: 1000, easing: easings.easeInOutSine },
    from: {
      ...initialPosition,
      splashOpacity: 0,
      deckOpacity: 0,
    },
    to: [
      { deckOpacity: 1 },
      { splashOpacity: 1 },
      { splashOpacity: 0 },
      { ...finalPosition },
      { splashOpacity: 1 },
      { splashOpacity: 0 },
      { deckOpacity: 0 },
    ],
    loop: true,
  })

  if (deckDef == null) return null

  const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
  const [deckXDimension, deckYDimension] = deckDef.dimensions
  const wholeDeckViewBox = `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`

  return (
    <AnimatedSvg
      viewBox={wholeDeckViewBox}
      opacity="1"
      style={{ opacity: springProps.deckOpacity }}
      transform="scale(1, -1)" // reflect horizontally about the center
      {...styleProps}
    >
      {deckDef != null && <DeckFromData def={deckDef} layerBlocklist={[]} />}
      {backgroundItems}
      <AnimatedG style={{ x: springProps.x, y: springProps.y }}>
        <g
          transform={`translate(${movedLabwareDef.cornerOffsetFromSlot.x}, ${movedLabwareDef.cornerOffsetFromSlot.y})`}
        >
          <rect
            x={OUTLINE_THICKNESS_MM}
            y={OUTLINE_THICKNESS_MM}
            strokeWidth={OUTLINE_THICKNESS_MM}
            stroke={COLORS.blueEnabled}
            fill={COLORS.white}
            width={
              movedLabwareDef.dimensions.xDimension - 2 * OUTLINE_THICKNESS_MM
            }
            height={
              movedLabwareDef.dimensions.yDimension - 2 * OUTLINE_THICKNESS_MM
            }
            rx={3 * OUTLINE_THICKNESS_MM}
          />
          {flatMap(
            movedLabwareDef.ordering,
            (row: string[], i: number, c: string[][]) =>
              row.map(wellName => (
                <Well
                  key={wellName}
                  wellDef={movedLabwareDef.wells[wellName]}
                />
              ))
          )}
          <AnimatedG style={{ opacity: springProps.splashOpacity }}>
            <path
              d="M158.027 111.537L154.651 108.186M145.875 113L145.875 109.253M161 99.3038L156.864 99.3038M11.9733 10.461L15.3495 13.8128M24.1255 9L24.1254 12.747M9 22.6962L13.1357 22.6962"
              stroke={COLORS.blueEnabled}
              strokeWidth="3.57"
              strokeLinecap="round"
              transform="scale(.97, -1) translate(-19, -104)"
            />
          </AnimatedG>
        </g>
      </AnimatedG>
    </AnimatedSvg>
  )
}

/**
 * These animated components needs to be split out because react-spring and styled-components don't play nice
 * @see https://github.com/pmndrs/react-spring/issues/1515 */
const AnimatedG = styled(animated.g)<any>``
const AnimatedSvg = styled(animated.svg)<any>``

interface WellProps {
  wellDef: LabwareWell
}
function Well(props: WellProps): JSX.Element {
  const { wellDef } = props
  const { x, y } = wellDef

  return wellDef.shape === 'rectangular' ? (
    <rect
      fill={COLORS.white}
      stroke={COLORS.black}
      x={x - wellDef.xDimension / 2}
      y={y - wellDef.yDimension / 2}
      width={wellDef.xDimension}
      height={wellDef.yDimension}
    />
  ) : (
    <circle
      fill={COLORS.white}
      stroke={COLORS.black}
      cx={x}
      cy={y}
      r={wellDef.diameter / 2}
    />
  )
}
