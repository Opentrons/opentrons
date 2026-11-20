import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { animated, easings, useSpring } from '@react-spring/web'
import styled from 'styled-components'

import {
  computeLabwareOrigin,
  getDeckDefFromRobotType,
  getLabwareViewBox,
} from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { BaseDeck } from '../BaseDeck'
import { LabwareRender } from '../Labware'
import { resolveLabwareLocation } from './resolveLabwareLocation'

import type { PropsWithChildren, ReactNode } from 'react'
import type {
  DeckConfiguration,
  DeckDefinition,
  LabwareDefinition,
  LabwareLocation,
  LoadedLabware,
  LoadedModule,
  RobotType,
  Vector3D,
} from '@opentrons/shared-data'
import type { LabwareOnDeck, ModuleOnDeck } from '../../hardware-sim/BaseDeck'
import type { StyleProps } from '../../primitives'

const SPLASH_Y_BUFFER_MM = 10

interface MoveLabwareOnDeckProps extends StyleProps {
  robotType: RobotType
  movedLabwareDef: LabwareDefinition
  initialLabwareLocation: LabwareLocation
  finalLabwareLocation: LabwareLocation
  loadedModules: LoadedModule[]
  loadedLabware: LoadedLabware[]
  modulesOnDeck?: ModuleOnDeck[]
  labwareOnDeck?: LabwareOnDeck[]
  labwareDefinitions: LabwareDefinition[]
  deckConfig: DeckConfiguration
  deckFill?: string
}
export function MoveLabwareOnDeck(
  props: MoveLabwareOnDeckProps
): JSX.Element | null {
  const {
    robotType,
    movedLabwareDef,
    loadedLabware,
    modulesOnDeck,
    labwareOnDeck,
    labwareDefinitions,
    initialLabwareLocation,
    finalLabwareLocation,
    loadedModules,
    deckConfig,
    ...styleProps
  } = props
  const deckDef = useMemo(() => getDeckDefFromRobotType(robotType), [robotType])

  const initialResolvedLocation = resolveLabwareLocation({
    deckDef,
    targetLabwareDef: movedLabwareDef,
    targetLabwareLocation: initialLabwareLocation,
    loadedModules,
    otherLoadedLabware: loadedLabware,
    otherLabwareDefinitions: labwareDefinitions,
  })
  const finalResolvedLocation = resolveLabwareLocation({
    deckDef,
    targetLabwareDef: movedLabwareDef,
    targetLabwareLocation: finalLabwareLocation,
    loadedModules,
    otherLoadedLabware: loadedLabware,
    otherLabwareDefinitions: labwareDefinitions,
  })

  const initialCoordinates =
    initialResolvedLocation === 'error' || initialResolvedLocation === 'offDeck'
      ? initialResolvedLocation
      : (computeLabwareOrigin(initialResolvedLocation) ?? 'error')
  const finalCoordinates =
    finalResolvedLocation === 'error' || finalResolvedLocation === 'offDeck'
      ? finalResolvedLocation
      : (computeLabwareOrigin(finalResolvedLocation) ?? 'error')

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

  const animationInitialCoordinates =
    initialCoordinates !== 'error' && initialCoordinates !== 'offDeck'
      ? initialCoordinates
      : offDeckCoordinates
  const animationFinalCoordinates =
    finalCoordinates !== 'error' && finalCoordinates !== 'offDeck'
      ? finalCoordinates
      : offDeckCoordinates

  // The user can't see the splash animation if it happens off-deck.
  // Skip it so there's no pause where it looks like nothing is happening.
  const shouldAnimateSplashBeforeMove =
    animationInitialCoordinates !== offDeckCoordinates
  const shouldAnimateSplashAfterMove =
    animationFinalCoordinates !== offDeckCoordinates

  const shouldReset = usePositionChangeReset(
    animationInitialCoordinates,
    animationFinalCoordinates
  )

  const [springProps] = useSpring(
    () => ({
      reset: shouldReset,
      config: { duration: 1000, easing: easings.easeInOutSine },
      from: {
        ...animationInitialCoordinates,
        splashOpacity: 0,
        deckOpacity: 0,
      },
      to: [
        { deckOpacity: 1 },
        ...(shouldAnimateSplashBeforeMove
          ? [{ splashOpacity: 1 }, { splashOpacity: 0 }]
          : []),
        { ...animationFinalCoordinates },
        ...(shouldAnimateSplashAfterMove
          ? [{ splashOpacity: 1 }, { splashOpacity: 0 }]
          : []),
        { deckOpacity: 0 },
      ],
      loop: true,
    }),
    // Dependency array:
    [
      shouldReset,
      // react-spring behaves weirdly if its props are updated too frequently.
      // So make sure to filter out coordinate "updates" that are just object identity
      // updates and not updates to the actual x/y/z components.
      ...Object.values(animationInitialCoordinates),
      ...Object.values(animationFinalCoordinates),
      shouldAnimateSplashBeforeMove,
      shouldAnimateSplashAfterMove,
    ]
  )

  return (
    <BaseDeck
      deckConfig={deckConfig}
      robotType={robotType}
      modulesOnDeck={modulesOnDeck}
      labwareOnDeck={labwareOnDeck}
      svgProps={{
        style: { opacity: springProps.deckOpacity },
        ...styleProps,
      }}
      animatedSVG
      // add fixedTrash not to display trash bin on OT-2 deck
      deckLayerBlocklist={robotType === 'OT-2 Standard' ? ['fixedTrash'] : []}
    >
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

  useLayoutEffect(
    () => {
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
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialPosition, finalPosition]
  )

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
): ReactNode {
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
