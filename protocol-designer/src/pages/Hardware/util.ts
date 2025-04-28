import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getModuleType,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_V2_REAR_FIXTURE,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import type { ModuleModel } from '@opentrons/shared-data'
import type { CutoutConfigExtended } from '../../components/organisms/HardwareConfigurator/AddFixtureModal'
import { deleteModule } from '../../modules'
import type { AllTemporalPropertiesForTimelineFrame } from '../../step-forms'
import { createModule } from '../../step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../step-forms/actions/additionalItems'
import type { DeckFixture } from '../../step-forms/actions/additionalItems'
import type { ThunkDispatch } from '../../types'
import { FIXTURES } from '../Designer/DeckSetup/constants'

export const updateInitialDeckState = (
  values: CutoutConfigExtended[],
  initialDeckSetup: AllTemporalPropertiesForTimelineFrame,
  dispatch: ThunkDispatch<any>
): void => {
  const { additionalEquipmentOnDeck, modules: moduleOnDeck } = initialDeckSetup
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  values.forEach(value => {
    if (value.cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE) {
      return
    }
    const matchingFixture = Object.values(additionalEquipmentOnDeck).find(
      ae => ae.name === (value.type as DeckFixture)
    )
    const matchingModule = Object.values(moduleOnDeck).find(
      module =>
        module.model === (value.type as ModuleModel) &&
        getCutoutIdForSlotName(module.slot, deckDef) === value.cutoutId
    )
    if (FIXTURES.includes(value.type as DeckFixture)) {
      if (matchingFixture != null) {
        dispatch(deleteDeckFixture(matchingFixture.id))
      } else {
        dispatch(createDeckFixture(value.type as DeckFixture, value.cutoutId))
      }
    } else if (value.type === 'stagingAreaAndMagneticBlock') {
      const matchingStagingArea = Object.values(additionalEquipmentOnDeck).find(
        ae => ae.name === 'stagingArea' && ae.location === value.cutoutId
      )
      if (matchingStagingArea != null) {
        dispatch(deleteDeckFixture(matchingStagingArea.id))
      } else {
        dispatch(
          createDeckFixture('stagingArea' as DeckFixture, value.cutoutId)
        )
      }
      const matchingModuleForAboveStaging = Object.values(moduleOnDeck).find(
        module =>
          module.model === MAGNETIC_BLOCK_V1 &&
          value.cutoutId.includes(module.slot)
      )
      if (matchingModuleForAboveStaging != null) {
        dispatch(deleteModule({ moduleId: matchingModuleForAboveStaging.id }))
      } else {
        dispatch(
          createModule({
            slot: value.cutoutId.split('cutout')[1],
            model: MAGNETIC_BLOCK_V1,
            type: MAGNETIC_BLOCK_TYPE,
          })
        )
      }
    } else if (value.type === 'stagingAreaAndWasteChute') {
      const matchingFixtures = Object.values(additionalEquipmentOnDeck).filter(
        ae =>
          ae.name === 'wasteChute' ||
          (ae.name === 'stagingArea' && ae.location === WASTE_CHUTE_CUTOUT)
      )
      if (matchingFixtures.length > 0) {
        matchingFixtures.forEach(fixture => {
          dispatch(deleteDeckFixture(fixture.id))
        })
      } else {
        dispatch(
          createDeckFixture('stagingArea' as DeckFixture, WASTE_CHUTE_CUTOUT)
        )
        dispatch(
          createDeckFixture('wasteChute' as DeckFixture, WASTE_CHUTE_CUTOUT)
        )
      }
    } else {
      if (matchingModule != null) {
        dispatch(deleteModule({ moduleId: matchingModule.id }))
      } else {
        const type = getModuleType(value.type as ModuleModel)
        const model = value.type as ModuleModel
        dispatch(
          createModule({
            slot: value.cutoutId.split('cutout')[1],
            model,
            type,
          })
        )
      }
    }
  })
}
