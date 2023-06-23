import * as React from 'react'
import { animated, useSpring } from '@react-spring/web'
import { ModuleDefinition, getDeckDefFromRobotType } from "@opentrons/shared-data"
import { RobotWorkSpace, RobotWorkSpaceProps } from "./RobotWorkSpace"
import { LabwareRender } from "../Labware"
import { getDeckDefinitions } from './getDeckDefinitions'

import type {
  Coordinates,
  LabwareDefinition2,
  LabwareLocation,
  ModuleLocation,
  RobotType,
  DeckSlot,
  DeckDefinition
} from "@opentrons/shared-data"

type ModuleInfoById = {
  [moduleId: string]: {
    location: ModuleLocation,
    moduleDef: ModuleDefinition
  }
}

function getLabwareCoordinates(
  orderedSlots: DeckSlot[],
  location: LabwareLocation,
  moduleInfoById: ModuleInfoById,
  deckId: DeckDefinition['otId']
): Coordinates | null {
  if (location === 'offDeck') {
    return null
  } else if ('slotName' in location) {
    return orderedSlots.find(s => s.id === location.slotName) ?? null
  } else {
    const moduleInfo = moduleInfoById[location.moduleId]
    if (moduleInfo == null) return null
    const modSlot = orderedSlots.find(s => s.id === moduleInfo.location.slotName)
    if (modSlot == null) return null
    const [modX, modY] = modSlot.position
    const [deckSpecificX, deckSpecificY] = moduleInfo.moduleDef?.slotTransforms?.[deckId]?.[modSlot.id] ?? [0,0]
    return null
  }
}

interface MoveLabwareOnDeckProps {
  robotType: RobotType
  movedLabwareDef: LabwareDefinition2
  initialLabwareLocation: LabwareLocation
  finalLabwareLocation: LabwareLocation
  moduleInfoById: ModuleInfoById
}
export function MoveLabwareOnDeck(props: MoveLabwareOnDeckProps): JSX.Element {
  const {
    robotType,
    movedLabwareDef,
    initialLabwareLocation,
    finalLabwareLocation,
    moduleInfoById
  } = props
  const deckDef = React.useMemo(() => getDeckDefFromRobotType(robotType), [robotType])



  const labwareWaypoints = [
    deckDef.locations.orderedSlots.find(s => )
  ]
  const springProps = useSpring({
    config: {
      duration: 3000,
    },
    from: { y: 0, x: 0 },
    to: async (next, cancel) => {
      await next({ x: -130 })
    },
    loop: true,
  })

  if (deckDef == null) return null
  let wholeDeckViewBox
  let deckSlotsById = {}
  if (deckDef != null) {
    const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = deckDef.dimensions

    deckSlotsById = deckDef.locations.orderedSlots.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )
    wholeDeckViewBox = `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
  }

  return (
    <Svg
      viewBox={viewBox || wholeDeckViewBox}
      ref={wrapperRef}
      id={id}
      opacity="1"
      /* reflect horizontally about the center of the DOM elem */
      transform="scale(1, -1)"
      {...styleProps}
    >
      <RobotWorkSpace {...robotWorkSpaceProps}>
        {(renderProps) => {
          return (
            <>
              {children != null ? children(renderProps) : null}
              <animated.g x={springProps.x} y={springProps.y}>
                <LabwareRender definition={movedLabwareDef} />
              </animated.g>
            </>
          )
        }}
      </RobotWorkSpace>
    </Svg>
  )
}

function TranslatedLabware()