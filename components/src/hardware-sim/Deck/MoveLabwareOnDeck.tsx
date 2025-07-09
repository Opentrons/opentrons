import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { animated, easings, useSpring } from '@react-spring/web'
import styled from 'styled-components'

import {
  computeLabwareOrigin,
  getDeckDefFromRobotType,
  getLabwareDefURI,
  getLabwareViewBox,
  getModuleDef,
} from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { BaseDeck } from '../BaseDeck'
import { LabwareRender } from '../Labware'

import type { PropsWithChildren, ReactNode } from 'react'
import type {
  DeckConfiguration,
  DeckDefinition,
  LabwareDefinition,
  LabwareLocation,
  LoadedLabware,
  LoadedModule,
  ModuleDefinition,
  RobotType,
  Vector3D,
} from '@opentrons/shared-data'
import type { StyleProps } from '../../primitives'

const SPLASH_Y_BUFFER_MM = 10

interface MoveLabwareOnDeckProps extends StyleProps {
  robotType: RobotType
  movedLabwareDef: LabwareDefinition
  initialLabwareLocation: LabwareLocation
  finalLabwareLocation: LabwareLocation
  loadedModules: LoadedModule[]
  loadedLabware: LoadedLabware[]
  labwareDefinitions: LabwareDefinition[]
  deckConfig: DeckConfiguration
  backgroundItems?: ReactNode
  deckFill?: string
}
export function MoveLabwareOnDeck(
  props: MoveLabwareOnDeckProps
): JSX.Element | null {
  const {
    robotType,
    movedLabwareDef,
    loadedLabware,
    labwareDefinitions,
    initialLabwareLocation,
    finalLabwareLocation,
    loadedModules,
    deckConfig,
    backgroundItems = null,
    ...styleProps
  } = props
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])

  const initialResolvedLocation = resolveLabwareLocation({
    deckDef,
    movedLabwareDef,
    location: initialLabwareLocation,
    loadedModules,
    loadedLabware,
    labwareDefinitions,
  })
  const finalResolvedLocation = resolveLabwareLocation({
    deckDef,
    movedLabwareDef,
    location: finalLabwareLocation,
    loadedModules,
    loadedLabware,
    labwareDefinitions,
  })

  const initialCoordinates =
    initialResolvedLocation === 'error' || initialResolvedLocation === 'offDeck'
      ? initialResolvedLocation
      : computeLabwareOrigin(initialResolvedLocation) ?? 'error'
  const finalCoordinates =
    finalResolvedLocation === 'error' || finalResolvedLocation === 'offDeck'
      ? finalResolvedLocation
      : computeLabwareOrigin(finalResolvedLocation) ?? 'error'

  const referenceForOffDeckCoordinates = (() => {
    if (initialCoordinates !== 'error' && initialCoordinates !== 'offDeck') {
      return initialCoordinates
    } else if (finalCoordinates !== 'error' && finalCoordinates !== 'offDeck') {
      return finalCoordinates
    } else {
      return { x: 0, y: 0, z: 0 }
    }
  })()
  const offDeckCoordinates = getOffDeckCoordinates(
    deckDef,
    movedLabwareDef,
    referenceForOffDeckCoordinates,
    SPLASH_Y_BUFFER_MM
  )

  const initialCoordinates2 =
    initialCoordinates !== 'error' && initialCoordinates !== 'offDeck'
      ? initialCoordinates
      : offDeckCoordinates
  const finalCoordinates2 =
    finalCoordinates !== 'error' && finalCoordinates !== 'offDeck'
      ? finalCoordinates
      : offDeckCoordinates

  const shouldReset = usePositionChangeReset(
    initialCoordinates2,
    finalCoordinates2
  )

  const springProps = useSpring({
    reset: shouldReset,
    config: { duration: 1000, easing: easings.easeInOutSine },
    from: {
      ...initialCoordinates2,
      splashOpacity: 0,
      deckOpacity: 0,
    },
    to: [
      { deckOpacity: 1 },
      { splashOpacity: 1 },
      { splashOpacity: 0 },
      { ...finalCoordinates2 },
      { splashOpacity: 1 },
      { splashOpacity: 0 },
      { deckOpacity: 0 },
    ],
    loop: true,
  })

  return (
    <BaseDeck
      deckConfig={deckConfig}
      robotType={robotType}
      svgProps={{
        style: { opacity: springProps.deckOpacity },
        ...styleProps,
      }}
      animatedSVG
    >
      {backgroundItems}
      <AnimatedG style={{ x: springProps.x, y: springProps.y }}>
        <LabwareRender
          definition={movedLabwareDef}
          positioningMode="passThrough"
          highlight={true}
        />
        <AnimatedG style={{ opacity: springProps.splashOpacity }}>
          <AlignSplashToLabware labwareDefinition={movedLabwareDef}>
            <path
              d="M158.027 111.537L154.651 108.186M145.875 113L145.875 109.253M161 99.3038L156.864 99.3038M11.9733 10.461L15.3495 13.8128M24.1255 9L24.1254 12.747M9 22.6962L13.1357 22.6962"
              stroke={COLORS.blue50}
              strokeWidth="3.57"
              strokeLinecap="round"
              transform="scale(.97, -1) translate(-19, -104)"
            />
          </AlignSplashToLabware>
        </AnimatedG>
      </AnimatedG>
    </BaseDeck>
  )
}

/**
 * Converts a labware location to something that computeLabwareOrigin() can take as
 * input and compute absolute deck coordinates from.
 *
 * This basically just does a lot of tedious lookups to resolve IDs into full definitions.
 *
 * Returns "error" if there was a problem doing the conversion, probably because of
 * some invalid input to this function, like entries missing from `loadedLabware`.
 * Returns "offDeck" if the labware is known to be off-deck, so it doesn't have
 * coordinates.
 */
function resolveLabwareLocation({
  deckDef,
  movedLabwareDef,
  location,
  loadedModules,
  loadedLabware,
  labwareDefinitions,
}: {
  deckDef: DeckDefinition
  movedLabwareDef: LabwareDefinition
  location: LabwareLocation
  loadedModules: LoadedModule[]
  loadedLabware: LoadedLabware[]
  labwareDefinitions: LabwareDefinition[]
}): 'error' | 'offDeck' | Parameters<typeof computeLabwareOrigin>[0] {
  // todo(mm, 2025-07-07): Dear god, this is so much code.
  // Can any of this be simplified or offloaded to existing helpers?

  const labwareTopToBottom = resolveLabwareStack({
    topLabwareDef: movedLabwareDef,
    topLabwareLocation: location,
    loadedLabware,
    labwareDefinitions,
  })
  const labwareBottomToTop =
    labwareTopToBottom != null ? labwareTopToBottom.toReversed() : null

  if (labwareBottomToTop == null || labwareBottomToTop.length < 1) {
    return 'error'
  }

  const bottomLabwareLocation = labwareBottomToTop[0].location

  if (
    bottomLabwareLocation === 'offDeck' ||
    bottomLabwareLocation === 'systemLocation'
  ) {
    return 'offDeck'
  }

  const bottom = (():
    | 'error'
    | {
        slotId: string
        moduleDefinition?: ModuleDefinition
      } => {
    if ('moduleId' in bottomLabwareLocation) {
      const loadedModule = loadedModules.find(
        m => m.id === bottomLabwareLocation.moduleId
      )
      if (loadedModule == null) return 'error'
      const moduleDefinition = getModuleDef(loadedModule.model)
      const modSlot = deckDef.locations.addressableAreas.find(
        s => s.id === loadedModule.location.slotName
      )
      if (modSlot == null) return 'error'
      return { slotId: modSlot.id, moduleDefinition }
    } else if ('slotName' in bottomLabwareLocation) {
      return { slotId: bottomLabwareLocation.slotName }
    } else if ('addressableAreaName' in bottomLabwareLocation) {
      return { slotId: bottomLabwareLocation.addressableAreaName }
    } else {
      // Should not be reachable if resolveLabwareStack() did its job.
      return 'error'
    }
  })()

  if (bottom === 'error') {
    return 'error'
  }

  return {
    deckDefinition: deckDef,
    slotId: bottom.slotId,
    moduleDefinition: bottom.moduleDefinition,
    labwareDefinitionsBottomToTop: labwareBottomToTop.map(l => l.definition),
  }
}

/**
 * Return the labware comprising the labware part of a stack. In other words, everything
 * from the top labware down to, and excluding, the underlying module or deck slot.
 */
function resolveLabwareStack({
  topLabwareDef,
  topLabwareLocation,
  loadedLabware,
  labwareDefinitions,
}: {
  topLabwareDef: LabwareDefinition
  topLabwareLocation: LabwareLocation
  loadedLabware: LoadedLabware[]
  labwareDefinitions: LabwareDefinition[]
}): Array<{
  definition: LabwareDefinition
  location: LabwareLocation
}> | null {
  let bottomMostLabwareSoFar = {
    definition: topLabwareDef,
    location: topLabwareLocation,
  }
  const labwareTopToBottomSoFar = [bottomMostLabwareSoFar]

  while (
    typeof bottomMostLabwareSoFar.location === 'object' &&
    'labwareId' in bottomMostLabwareSoFar.location
  ) {
    const newBottomLabwareId = bottomMostLabwareSoFar.location.labwareId
    const newBottomLabware = loadedLabware.find(
      l => l.id === newBottomLabwareId
    )
    const newBottomLabwareDefinition = labwareDefinitions.find(
      def => getLabwareDefURI(def) === newBottomLabware?.definitionUri
    )
    if (newBottomLabware == null || newBottomLabwareDefinition == null) {
      console.warn(
        `Expected to find details for labware ID ${newBottomLabwareId} but could not.`
      )
      return null
    }
    bottomMostLabwareSoFar = {
      definition: newBottomLabwareDefinition,
      location: newBottomLabware.location,
    }
    labwareTopToBottomSoFar.push(bottomMostLabwareSoFar)
  }

  return labwareTopToBottomSoFar
}

/**
 * Returns the coordinates of a location beyond the bounds of the deck.
 *
 * @param onDeckCoordinates - The coordinates of the labware when it's on-deck. The
 *  off-deck location is chosen to be vertically aligned with this, so the animation
 *  goes straight up or down.
 */
function getOffDeckCoordinates(
  deckDefinition: DeckDefinition,
  labwareDefinition: LabwareDefinition,
  onDeckCoordinates: Vector3D,
  extraMargin: number
): Vector3D {
  const labwareViewBox = getLabwareViewBox(labwareDefinition)
  const labwareOriginToLabwareMaxY =
    labwareViewBox.minY + labwareViewBox.yDimension
  const margin = labwareOriginToLabwareMaxY + extraMargin
  const deckMinY = deckDefinition.cornerOffsetFromOrigin[1]
  const y = deckMinY - margin - labwareOriginToLabwareMaxY
  return {
    ...onDeckCoordinates,
    y,
  }
}

function usePositionChangeReset(
  initialPosition: { x: number; y: number },
  finalPosition: { x: number; y: number }
): boolean {
  const [shouldReset, setShouldReset] = useState(false)

  useLayoutEffect(() => {
    if (shouldReset) {
      setShouldReset(false)
      return
    }

    const isNewPosition =
      previousInitialRef.current?.x !== initialPosition.x ||
      previousInitialRef.current?.y !== initialPosition.y ||
      previousFinalRef.current?.x !== finalPosition.x ||
      previousFinalRef.current?.y !== finalPosition.y

    if (isNewPosition) {
      setShouldReset(true)
    }

    previousInitialRef.current = initialPosition
    previousFinalRef.current = finalPosition
  }, [initialPosition, finalPosition])

  const previousInitialRef = useRef(initialPosition)
  const previousFinalRef = useRef(finalPosition)

  return shouldReset
}

/**
 * The splash SVG is made for its origin to be placed at the -x,-y corner of a labware
 * (or the slot that the labware is in). If this component is placed at the labware
 * origin and the splash is placed inside this component, it will align the splash
 * accordingly.
 */
function AlignSplashToLabware(
  props: PropsWithChildren<{ labwareDefinition: LabwareDefinition }>
): JSX.Element {
  const { labwareDefinition, children } = props
  const labwareViewBox = getLabwareViewBox(labwareDefinition)
  const labwareOriginToFrontLeftCorner = {
    x: labwareViewBox.minX,
    y: labwareViewBox.minY,
  }
  return (
    <g
      transform={`translate(${labwareOriginToFrontLeftCorner.x} ${labwareOriginToFrontLeftCorner.y})`}
    >
      {children}
    </g>
  )
}

/**
 * These animated components needs to be split out because react-spring and styled-components don't play nice
 * @see https://github.com/pmndrs/react-spring/issues/1515 */
const AnimatedG = styled(animated.g as any)``
