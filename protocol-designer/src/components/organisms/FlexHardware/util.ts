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
import { deleteModule } from '../../../modules'
import {
  createModule,
  editDeckConfiguration,
} from '../../../step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../../step-forms/actions/additionalItems'
import { FIXTURES } from '../../../pages/Designer/DeckSetup/constants'
import type { DeckConfiguration, ModuleModel } from '@opentrons/shared-data'
import type { CutoutConfigExtended } from '../HardwareConfigurator/AddFixtureModal'
import type { ThunkDispatch } from '../../../types'
import type { DeckFixture } from '../../../step-forms/actions/additionalItems'
import type {
  AllTemporalPropertiesForTimelineFrame,
  SavedStepFormState,
} from '../../../step-forms'
import type { Dispatch, SetStateAction } from 'react'
import { getHardwareInSlotInUse } from './getHardwareInSlotInUse'

const map3rdColumnCutoutTo4thColumnSlot: Record<string, string> = {
  cutoutA3: 'A4',
  cutoutB3: 'B4',
  cutoutC3: 'C4',
  cutoutD3: 'D4',
}
export const updateInitialDeckState = (
  values: CutoutConfigExtended[],
  initialDeckSetup: AllTemporalPropertiesForTimelineFrame,
  dispatch: ThunkDispatch<any>,
  setShowDeleteEntityModal: Dispatch<
    SetStateAction<{
      ids: string[]
      deckConfig: DeckConfiguration
    } | null>
  >,
  savedSteps: SavedStepFormState,
  deckConfig?: DeckConfiguration
): void => {
  const {
    additionalEquipmentOnDeck,
    modules: moduleOnDeck,
    labware: labwareOnDeck,
  } = initialDeckSetup
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  values.forEach(value => {
    if (value.cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE) {
      return
    }
    const matchingFixture = Object.values(additionalEquipmentOnDeck).find(
      ae => ae.name === (value.type as DeckFixture)
    )
    const fourthColumnSlot =
      matchingFixture != null
        ? map3rdColumnCutoutTo4thColumnSlot[matchingFixture.location]
        : null

    const matchingModule = Object.values(moduleOnDeck).find(
      module =>
        module.model === (value.type as ModuleModel) &&
        getCutoutIdForSlotName(module.slot, deckDef) === value.cutoutId
    )
    const matching4thColumnLabware =
      matchingFixture != null && matchingFixture.name === 'stagingArea'
        ? Object.values(labwareOnDeck).find(
            labware => labware.slot === fourthColumnSlot
          ) ?? null
        : null
    const {
      moduleId,
      fixtureIds,
      fourthColumnSlotLabwareId,
    } = getHardwareInSlotInUse(
      savedSteps,
      matching4thColumnLabware,
      matchingModule,
      matchingFixture != null ? [matchingFixture] : undefined
    )
    if (FIXTURES.includes(value.type as DeckFixture)) {
      if (matchingFixture != null) {
        if (fixtureIds != null && deckConfig != null) {
          setShowDeleteEntityModal({
            ids:
              fourthColumnSlotLabwareId != null
                ? [...fixtureIds, ...fourthColumnSlotLabwareId]
                : fixtureIds,
            deckConfig,
          })
        } else {
          dispatch(deleteDeckFixture(matchingFixture.id))
          if (deckConfig != null) {
            dispatch(editDeckConfiguration({ deckConfig }))
          }
        }
      } else {
        dispatch(createDeckFixture(value.type as DeckFixture, value.cutoutId))
      }
    } else if (value.type === 'stagingAreaAndMagneticBlock') {
      const matchingStagingArea = Object.values(additionalEquipmentOnDeck).find(
        ae => ae.name === 'stagingArea' && ae.location === value.cutoutId
      )
      const matchingModuleForAboveStaging = Object.values(moduleOnDeck).find(
        module =>
          module.model === MAGNETIC_BLOCK_V1 &&
          value.cutoutId.includes(module.slot)
      )
      const fourthColumnSlotNextToMagBlock =
        matchingStagingArea != null
          ? map3rdColumnCutoutTo4thColumnSlot[matchingStagingArea.location]
          : null
      const matching4thColumnLabwarNextToMagBlock =
        matchingStagingArea != null &&
        matchingStagingArea.name === 'stagingArea'
          ? Object.values(labwareOnDeck).find(
              labware => labware.slot === fourthColumnSlotNextToMagBlock
            ) ?? null
          : null
      const {
        moduleId,
        fixtureIds,
        fourthColumnSlotLabwareId,
      } = getHardwareInSlotInUse(
        savedSteps,
        matching4thColumnLabwarNextToMagBlock,
        matchingModuleForAboveStaging,
        matchingStagingArea != null ? [matchingStagingArea] : undefined
      )

      if (
        matchingStagingArea != null &&
        fixtureIds == null &&
        fourthColumnSlotLabwareId == null
      ) {
        dispatch(deleteDeckFixture(matchingStagingArea.id))
        if (deckConfig != null) {
          dispatch(editDeckConfiguration({ deckConfig }))
        }
      } else if (
        matchingStagingArea != null &&
        (fixtureIds != null || fourthColumnSlotLabwareId != null) &&
        deckConfig != null
      ) {
        const idsToDelete = [
          ...(fixtureIds ?? []),
          ...(fourthColumnSlotLabwareId ? [fourthColumnSlotLabwareId] : []),
        ]
        setShowDeleteEntityModal({ ids: idsToDelete, deckConfig })
      } else {
        dispatch(
          createDeckFixture('stagingArea' as DeckFixture, value.cutoutId)
        )
      }
      if (matchingModuleForAboveStaging != null) {
        if (moduleId != null && deckConfig != null) {
          setShowDeleteEntityModal({ ids: [moduleId], deckConfig })
        } else {
          dispatch(deleteModule({ moduleId: matchingModuleForAboveStaging.id }))
          if (deckConfig != null) {
            dispatch(editDeckConfiguration({ deckConfig }))
          }
        }
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

      const matching4thColumnLabwareInD4 =
        Object.values(labwareOnDeck).find(labware => labware.slot === 'D4') ??
        null

      const { fixtureIds, fourthColumnSlotLabwareId } = getHardwareInSlotInUse(
        savedSteps,
        matching4thColumnLabwareInD4,
        undefined,
        matchingFixtures
      )
      if (
        matchingFixtures.length > 0 &&
        fixtureIds == null &&
        fourthColumnSlotLabwareId == null
      ) {
        matchingFixtures.forEach(fixture => {
          dispatch(deleteDeckFixture(fixture.id))
        })
        if (deckConfig != null) {
          dispatch(editDeckConfiguration({ deckConfig }))
        }
      } else if (
        matchingFixtures.length > 0 &&
        (fixtureIds != null || fourthColumnSlotLabwareId != null) &&
        deckConfig != null
      ) {
        const idsToDelete = [
          ...(fixtureIds ?? []),
          ...(fourthColumnSlotLabwareId ? [fourthColumnSlotLabwareId] : []),
        ]
        setShowDeleteEntityModal({ ids: idsToDelete, deckConfig })
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
        if (moduleId != null && deckConfig != null) {
          setShowDeleteEntityModal({ ids: [moduleId], deckConfig })
        } else {
          dispatch(deleteModule({ moduleId: matchingModule.id }))
          if (deckConfig != null) {
            dispatch(editDeckConfiguration({ deckConfig }))
          }
        }
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
