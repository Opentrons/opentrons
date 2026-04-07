import { SlotBase } from './SlotBase'
import { SlotClip } from './SlotClip'

import type { SVGProps } from 'react'
import type { DeckDefinition, ModuleType } from '@opentrons/shared-data'

export type StagingAreaLocation =
  | 'cutoutA3'
  | 'cutoutB3'
  | 'cutoutC3'
  | 'cutoutD3'

interface StagingAreaFixtureProps extends SVGProps<SVGGElement> {
  cutoutId: StagingAreaLocation
  deckDefinition: DeckDefinition
  moduleType?: ModuleType
  fixtureBaseColor?: SVGProps<SVGPathElement>['fill']
  slotClipColor?: SVGProps<SVGPathElement>['stroke']
  showExtensions?: boolean
  showSlotClips?: boolean
}

export function StagingAreaFixture(
  props: StagingAreaFixtureProps
): JSX.Element | null {
  const {
    cutoutId,
    deckDefinition,
    fixtureBaseColor,
    slotClipColor,
    showSlotClips = true,
    ...restProps
  } = props

  const cutoutDef = deckDefinition?.locations.cutouts.find(
    s => s.id === cutoutId
  )
  if (cutoutDef == null) {
    console.warn(
      `cannot render StagingAreaFixture, no cutout named: ${cutoutDef} in deck def ${deckDefinition?.otId}`
    )
    return null
  }
  const contentsByCutoutLocation: {
    [cutoutId in StagingAreaLocation]: JSX.Element
  } = {
    cutoutA3: (
      <>
        <g transform={'translate(164, 107)'}>
          <SlotBase
            d="M150.8,310h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C146.5,308.1,148.4,310,150.8,310z"
            fill={fixtureBaseColor}
          />
          {showSlotClips ? (
            <>
              <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
              <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
              <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
              <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
            </>
          ) : null}
        </g>
        <g transform={'translate(328, 107)'}>
          <SlotBase
            d="M163.8,310h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C146.5,308.1,148.4,310,150.8,310z"
            fill={fixtureBaseColor}
          />
          {showSlotClips ? (
            <>
              <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
              <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
              <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
              <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
            </>
          ) : null}
        </g>
      </>
    ),

    cutoutB3: (
      <>
        <g transform={'translate(164, 0)'}>
          <SlotBase
            d="M150.8,310h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C146.5,308.1,148.4,310,150.8,310z"
            fill={fixtureBaseColor}
          />
          {showSlotClips ? (
            <>
              <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
              <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
              <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
              <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
            </>
          ) : null}
        </g>
        <g transform={'translate(328, 0)'}>
          <SlotBase
            d="M163.8,310h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C146.5,308.1,148.4,310,150.8,310z"
            fill={fixtureBaseColor}
          />
          {showSlotClips ? (
            <>
              <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
              <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
              <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
              <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
            </>
          ) : null}
        </g>
      </>
    ),
    cutoutC3: (
      <>
        <g transform={'translate(164, -107)'}>
          <SlotBase
            d="M150.8,310h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C146.5,308.1,148.4,310,150.8,310z"
            fill={fixtureBaseColor}
          />
          {showSlotClips ? (
            <>
              <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
              <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
              <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
              <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
            </>
          ) : null}
        </g>
        <g transform={'translate(328, -107)'}>
          <SlotBase
            d="M163.8,310h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C146.5,308.1,148.4,310,150.8,310z"
            fill={fixtureBaseColor}
          />
          {showSlotClips ? (
            <>
              <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
              <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
              <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
              <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
            </>
          ) : null}
        </g>
      </>
    ),
    cutoutD3: (
      <>
        <>
          <g transform={'translate(164, -214)'}>
            <SlotBase
              d="M150.8,310h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C146.5,308.1,148.4,310,150.8,310z"
              fill={fixtureBaseColor}
            />
            {showSlotClips ? (
              <>
                <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
                <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
                <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
                <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
              </>
            ) : null}
          </g>
          <g transform={'translate(328, -214)'}>
            <SlotBase
              d="M163.8,310h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.2c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.2C146.5,308.1,148.4,310,150.8,310z"
              fill={fixtureBaseColor}
            />
            {showSlotClips ? (
              <>
                <SlotClip d="M326,398.9V409h10.8" stroke={slotClipColor} />,
                <SlotClip d="M326,329.8v-10.5h10.6" stroke={slotClipColor} />,
                <SlotClip d="M457.8,398.9V409H447" stroke={slotClipColor} />,
                <SlotClip d="M457.8,329.8v-10.7H447" stroke={slotClipColor} />
              </>
            ) : null}
          </g>
        </>
      </>
    ),
  }

  return <g {...restProps}>{contentsByCutoutLocation[cutoutId]}</g>
}
