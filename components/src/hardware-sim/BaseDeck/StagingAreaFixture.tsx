import { MiddleSlot } from './MiddleSlot'

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
    stroke,
    showSlotClips = false,
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
        <g transform={'translate(164, 0)'}>
          <MiddleSlot
            showSlotClips={showSlotClips}
            fixtureBaseColor={fixtureBaseColor}
            slotClipColor={slotClipColor}
            stroke={stroke}
          ></MiddleSlot>
        </g>
        <g transform={'translate(328, 0)'}>
          <MiddleSlot
            showSlotClips={showSlotClips}
            fixtureBaseColor={fixtureBaseColor}
            slotClipColor={slotClipColor}
            stroke={stroke}
          ></MiddleSlot>
        </g>
      </>
    ),
    cutoutB3: (
      <>
        <g transform={'translate(164, -107)'}>
          <MiddleSlot
            showSlotClips={showSlotClips}
            fixtureBaseColor={fixtureBaseColor}
            slotClipColor={slotClipColor}
            stroke={stroke}
          ></MiddleSlot>
        </g>
        <g transform={'translate(328, -107)'}>
          <MiddleSlot
            showSlotClips={showSlotClips}
            fixtureBaseColor={fixtureBaseColor}
            slotClipColor={slotClipColor}
            stroke={stroke}
          ></MiddleSlot>
        </g>
      </>
    ),
    cutoutC3: (
      <>
        <g transform={'translate(164, -214)'}>
          <MiddleSlot
            showSlotClips={showSlotClips}
            fixtureBaseColor={fixtureBaseColor}
            slotClipColor={slotClipColor}
            stroke={stroke}
          ></MiddleSlot>
        </g>
        <g transform={'translate(328, -214)'}>
          <MiddleSlot
            showSlotClips={showSlotClips}
            fixtureBaseColor={fixtureBaseColor}
            slotClipColor={slotClipColor}
            stroke={stroke}
          ></MiddleSlot>
        </g>
      </>
    ),
    cutoutD3: (
      <>
        <>
          <g transform={'translate(164, -321)'}>
            <MiddleSlot
              showSlotClips={showSlotClips}
              fixtureBaseColor={fixtureBaseColor}
              slotClipColor={slotClipColor}
              stroke={stroke}
            ></MiddleSlot>
          </g>
          <g transform={'translate(328, -321)'}>
            <MiddleSlot
              showSlotClips={showSlotClips}
              fixtureBaseColor={fixtureBaseColor}
              slotClipColor={slotClipColor}
              stroke={stroke}
            ></MiddleSlot>
          </g>
        </>
      </>
    ),
  }

  return <g {...restProps}>{contentsByCutoutLocation[cutoutId]}</g>
}
