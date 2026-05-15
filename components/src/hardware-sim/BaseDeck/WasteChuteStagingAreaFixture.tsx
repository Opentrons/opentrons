import { WASTE_CHUTE_CUTOUT } from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { MiddleSlot } from './MiddleSlot'
import { WasteChute } from './WasteChuteFixture'

import type { SVGProps } from 'react'
import type { DeckDefinition, ModuleType } from '@opentrons/shared-data'
import type { DeckLabelProps } from '../../molecules'

interface WasteChuteStagingAreaFixtureProps extends SVGProps<SVGGElement> {
  cutoutId: typeof WASTE_CHUTE_CUTOUT
  deckDefinition: DeckDefinition
  moduleType?: ModuleType
  fixtureBaseColor?: SVGProps<SVGPathElement>['fill']
  slotClipColor?: SVGProps<SVGPathElement>['stroke']
  wasteChuteColor?: string
  showExtensions?: boolean
  showHighlight?: boolean
  tagInfo?: DeckLabelProps[]
  showSlotClips?: boolean
}

export function WasteChuteStagingAreaFixture(
  props: WasteChuteStagingAreaFixtureProps
): JSX.Element | null {
  const {
    cutoutId,
    deckDefinition,
    stroke,
    fixtureBaseColor = COLORS.grey35,
    slotClipColor = COLORS.grey60,
    wasteChuteColor = COLORS.grey50,
    showHighlight,
    tagInfo,
    showSlotClips = false,
  } = props

  if (cutoutId !== WASTE_CHUTE_CUTOUT) {
    console.warn(
      `cannot render WasteChuteStagingAreaFixture in given cutout location ${cutoutId}`
    )
    return null
  }

  const cutoutDef = deckDefinition?.locations.cutouts.find(
    s => s.id === cutoutId
  )
  if (cutoutDef == null) {
    console.warn(
      `cannot render WasteChuteStagingAreaFixture, no cutout named: ${cutoutDef} in deck def ${deckDefinition?.otId}`
    )
    return null
  }

  return (
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

      <WasteChute
        wasteIconColor={fixtureBaseColor}
        backgroundColor={wasteChuteColor}
        showHighlight={showHighlight}
        tagInfo={tagInfo}
      />
    </>
  )
}
