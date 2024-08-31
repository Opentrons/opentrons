import { getPositionFromSlotId } from '@opentrons/shared-data'
import type {
  AdditionalEquipmentName,
  DeckSlot,
} from '@opentrons/step-generation'
import type { CoordinateTuple, DeckDefinition } from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  LabwareOnDeck,
  ModuleOnDeck,
} from '../../step-forms'
import type { Fixture } from './DeckSetup/constants'

interface AdditionalEquipment {
  name: AdditionalEquipmentName
  id: string
  location?: string
}

interface SlotInformation {
  slotPosition: CoordinateTuple | null
  createdModuleForSlot?: ModuleOnDeck
  createdLabwareForSlot?: LabwareOnDeck
  createdNestedLabwareForSlot?: LabwareOnDeck
  createFixtureForSlots?: AdditionalEquipment[]
  preSelectedFixture?: Fixture
}

interface SlotInformationProps {
  deckSetup: AllTemporalPropertiesForTimelineFrame
  slot: DeckSlot
  deckDef?: DeckDefinition
}
export const getSlotInformation = (
  props: SlotInformationProps
): SlotInformation => {
  const { slot, deckSetup, deckDef } = props
  const slotPosition =
    deckDef != null ? getPositionFromSlotId(slot, deckDef) ?? null : null
  const {
    labware: deckSetupLabware,
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
  } = deckSetup
  const createdModuleForSlot = Object.values(deckSetupModules).find(
    module => module.slot === slot
  )
  const createdLabwareForSlot = Object.values(deckSetupLabware).find(
    lw => lw.slot === slot || lw.slot === createdModuleForSlot?.id
  )
  const createdNestedLabwareForSlot = Object.values(deckSetupLabware).find(lw =>
    Object.keys(deckSetupLabware).includes(lw.slot)
  )
  const createFixtureForSlots = Object.values(additionalEquipmentOnDeck).filter(
    ae => ae.location?.split('cutout')[1] === slot
  )

  const preSelectedFixture =
    createFixtureForSlots != null && createFixtureForSlots.length === 2
      ? ('wasteChuteAndStagingArea' as Fixture)
      : (createFixtureForSlots[0]?.name as Fixture)

  return {
    createdModuleForSlot,
    createdLabwareForSlot,
    createdNestedLabwareForSlot,
    createFixtureForSlots,
    preSelectedFixture,
    slotPosition: slotPosition,
  }
}
