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
import { deleteModule } from '../../modules'
import { createModule } from '../../step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../step-forms/actions/additionalItems'
import { FIXTURES } from '../Designer/DeckSetup/constants'
import type { ModuleModel } from '@opentrons/shared-data'
import type { CutoutConfigExtended } from '../../components/organisms/HardwareConfigurator/AddFixtureModal'
import type { ThunkDispatch } from '../../types'
import type { DeckFixture } from '../../step-forms/actions/additionalItems'
import type { AllTemporalPropertiesForTimelineFrame } from '../../step-forms'

export const updateInitialDeckState = (
  value: CutoutConfigExtended[],
  initialDeckSetup: AllTemporalPropertiesForTimelineFrame,
  dispatch: ThunkDispatch<any>
): void => {
  const { additionalEquipmentOnDeck, modules: moduleOnDeck } = initialDeckSetup
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  value.forEach(val => {
    if (val.cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE) {
      return
    }
    const matchingFixture = Object.values(additionalEquipmentOnDeck).find(
      ae => ae.name === (val.type as DeckFixture)
    )
    const matchingModule = Object.values(moduleOnDeck).find(
      module =>
        module.model === (val.type as ModuleModel) &&
        getCutoutIdForSlotName(module.slot, deckDef) === val.cutoutId
    )
    if (FIXTURES.includes(val.type as DeckFixture)) {
      if (matchingFixture != null) {
        dispatch(deleteDeckFixture(matchingFixture.id))
      } else {
        dispatch(createDeckFixture(val.type as DeckFixture, val.cutoutId))
      }
    } else if (val.type === 'stagingAreaAndMagneticBlock') {
      const matchingStagingArea = Object.values(additionalEquipmentOnDeck).find(
        ae => ae.name === 'stagingArea' && ae.location === val.cutoutId
      )
      if (matchingStagingArea != null) {
        dispatch(deleteDeckFixture(matchingStagingArea.id))
      } else {
        dispatch(createDeckFixture('stagingArea' as DeckFixture, val.cutoutId))
      }
      const matchingModuleForAboveStaging = Object.values(moduleOnDeck).find(
        module =>
          module.model === MAGNETIC_BLOCK_V1 &&
          val.cutoutId.includes(module.slot)
      )
      if (matchingModuleForAboveStaging != null) {
        dispatch(deleteModule({ moduleId: matchingModuleForAboveStaging.id }))
      } else {
        dispatch(
          createModule({
            slot: val.cutoutId.split('cutout')[1],
            model: MAGNETIC_BLOCK_V1,
            type: MAGNETIC_BLOCK_TYPE,
          })
        )
      }
    } else if (val.type === 'stagingAreaAndWasteChute') {
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
        const type = getModuleType(val.type as ModuleModel)
        const model = val.type as ModuleModel
        dispatch(
          createModule({
            slot: val.cutoutId.split('cutout')[1],
            model,
            type,
          })
        )
      }
    }
  })
}
