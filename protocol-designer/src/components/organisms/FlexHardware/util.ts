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
import { FIXTURES } from '../../../pages/Designer/DeckSetup/constants'
import {
  createModule,
  editDeckConfiguration,
} from '../../../step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../../step-forms/actions/additionalItems'
import { getLabwareNotCompatibleWithModule, getSlotHasLabware } from '../utils'
import { getHardwareInSlotInUse } from './getHardwareInSlotInUse'

import type { Dispatch, SetStateAction } from 'react'
import type { DeckConfiguration, ModuleModel } from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  SavedStepFormState,
} from '../../../step-forms'
import type { DeckFixture } from '../../../step-forms/actions/additionalItems'
import type { ThunkDispatch } from '../../../types'
import type { CutoutConfigExtended } from '../HardwareConfigurator/AddFixtureModal'
import type { MakeSnackbar } from '../Kitchen/KitchenContext'

const map3rdColumnCutoutTo4thColumnSlot: Record<string, string> = {
  cutoutA3: 'A4',
  cutoutB3: 'B4',
  cutoutC3: 'C4',
  cutoutD3: 'D4',
}

interface UpdateInitialDeckSetupProps {
  values: CutoutConfigExtended[]
  initialDeckSetup: AllTemporalPropertiesForTimelineFrame
  dispatch: ThunkDispatch<any>
  setShowDeleteEntityModal: Dispatch<
    SetStateAction<{
      ids: string[]
      deckConfig: DeckConfiguration
    } | null>
  >
  setShowDeleteStagingAreaModal: Dispatch<
    SetStateAction<{
      ids: string[]
      deckConfig: DeckConfiguration
    } | null>
  >
  savedSteps: SavedStepFormState
  makeSnackbar: MakeSnackbar
  t: any
  deckConfig?: DeckConfiguration
}

export const updateInitialDeckState = (
  props: UpdateInitialDeckSetupProps
): void => {
  const {
    values,
    initialDeckSetup,
    dispatch,
    setShowDeleteEntityModal,
    setShowDeleteStagingAreaModal,
    savedSteps,
    makeSnackbar,
    t,
    deckConfig,
  } = props

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
    const hasLabwareOnSlot = getSlotHasLabware(labwareOnDeck, value.cutoutId)
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
      matchingFixture != null &&
      matchingFixture.name === 'stagingArea' &&
      fourthColumnSlot != null
        ? Object.values(labwareOnDeck).find(labware =>
            labware.stack.includes(fourthColumnSlot)
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
    //  updating fixtures only
    if (FIXTURES.includes(value.type as DeckFixture)) {
      if (matchingFixture != null) {
        //  if deleting staging area with labware in 4th column slot
        if (
          matchingFixture.name === 'stagingArea' &&
          fixtureIds == null &&
          matching4thColumnLabware != null &&
          deckConfig != null
        ) {
          setShowDeleteStagingAreaModal({
            ids: [matching4thColumnLabware.id, matchingFixture.id],
            deckConfig,
          })
          //  if deleting fixture that is in use
        } else if (fixtureIds != null && deckConfig != null) {
          setShowDeleteEntityModal({
            ids:
              fourthColumnSlotLabwareId != null
                ? [...fixtureIds, ...fourthColumnSlotLabwareId]
                : fixtureIds,
            deckConfig,
          })
          //  if deleting fixture that is not in use
        } else {
          dispatch(deleteDeckFixture(matchingFixture.id))
          if (deckConfig != null) {
            dispatch(editDeckConfiguration({ deckConfig }))
          }
        }
        //  creating fixture
      } else {
        //  if creating a trashBin or wasteChute and there is a labware on the slot
        if (
          hasLabwareOnSlot &&
          (value.type === 'trashBin' || value.type === 'wasteChute')
        ) {
          makeSnackbar(t('conflict_on_slot_labware_fixture') as string)
        } else {
          dispatch(createDeckFixture(value.type as DeckFixture, value.cutoutId))
        }
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
        matchingStagingArea.name === 'stagingArea' &&
        fourthColumnSlotNextToMagBlock != null
          ? Object.values(labwareOnDeck).find(labware =>
              labware.stack.includes(fourthColumnSlotNextToMagBlock)
            ) ?? null
          : null
      const { fixtureIds, fourthColumnSlotLabwareId } = getHardwareInSlotInUse(
        savedSteps,
        matching4thColumnLabwarNextToMagBlock,
        matchingModuleForAboveStaging,
        matchingStagingArea != null ? [matchingStagingArea] : undefined
      )
      const labwareNotCompatible =
        matchingModuleForAboveStaging != null
          ? getLabwareNotCompatibleWithModule(
              matchingModuleForAboveStaging.type,
              labwareOnDeck,
              value.cutoutId
            )
          : null
      //  if deleting staging area where labware is in 4th column slot
      if (
        matchingStagingArea != null &&
        fixtureIds == null &&
        matching4thColumnLabwarNextToMagBlock != null &&
        deckConfig != null
      ) {
        setShowDeleteStagingAreaModal({
          ids: [
            matching4thColumnLabwarNextToMagBlock.id,
            matchingStagingArea.id,
          ],

          deckConfig,
        })
        //   if deleting staging area not in use
      } else if (
        matchingStagingArea != null &&
        fixtureIds == null &&
        fourthColumnSlotLabwareId == null
      ) {
        dispatch(deleteDeckFixture(matchingStagingArea.id))
        if (deckConfig != null) {
          dispatch(editDeckConfiguration({ deckConfig }))
        }
        //   if delete staging area that is in use
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
        //  creating fixture
      } else {
        dispatch(
          createDeckFixture('stagingArea' as DeckFixture, value.cutoutId)
        )
      }
      if (matchingModuleForAboveStaging != null) {
        //   if deleting magnetic block
        dispatch(deleteModule({ moduleId: matchingModuleForAboveStaging.id }))
        if (deckConfig != null) {
          dispatch(editDeckConfiguration({ deckConfig }))
        }
        //   creating module
      } else {
        const slot = value.cutoutId.split('cutout')[1]
        if (labwareNotCompatible == null) {
          dispatch(
            createModule({
              slot,
              model: MAGNETIC_BLOCK_V1,
              type: MAGNETIC_BLOCK_TYPE,
            })
          )
          //  trying to create module but incompatible labware is in the way
        } else {
          makeSnackbar(t('module_incompatible', { slot }) as string)
        }
      }
    } else if (value.type === 'stagingAreaAndWasteChute') {
      const matchingFixtures = Object.values(additionalEquipmentOnDeck).filter(
        ae =>
          ae.name === 'wasteChute' ||
          (ae.name === 'stagingArea' && ae.location === WASTE_CHUTE_CUTOUT)
      )

      const matching4thColumnLabwareInD4 =
        Object.values(labwareOnDeck).find(labware =>
          labware.stack.includes('D4')
        ) ?? null

      const { fixtureIds, fourthColumnSlotLabwareId } = getHardwareInSlotInUse(
        savedSteps,
        matching4thColumnLabwareInD4,
        undefined,
        matchingFixtures
      )
      //   if deleting staging area where labware is in 4th column slot
      if (
        matchingFixtures.length > 0 &&
        fixtureIds == null &&
        matching4thColumnLabwareInD4 != null &&
        deckConfig != null
      ) {
        const matchingFixtureIds = matchingFixtures.map(fixture => fixture.id)
        setShowDeleteStagingAreaModal({
          ids: [matching4thColumnLabwareInD4.id, ...matchingFixtureIds],
          deckConfig,
        })
        //   if deleting staging area + waste chute not in use
      } else if (
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
        //   if deleting staging area + waste chute and one is in use
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
        //  creating fixtures
      } else {
        // if there is a labware on the slot do not create the staging area & waste chute
        if (hasLabwareOnSlot) {
          makeSnackbar(t('conflict_on_slot_labware_fixture') as string)
        } else {
          dispatch(
            createDeckFixture('stagingArea' as DeckFixture, WASTE_CHUTE_CUTOUT)
          )
          dispatch(
            createDeckFixture('wasteChute' as DeckFixture, WASTE_CHUTE_CUTOUT)
          )
        }
      }
    } else {
      //  if deleting module in use
      if (matchingModule != null) {
        if (moduleId != null && deckConfig != null) {
          setShowDeleteEntityModal({ ids: [moduleId], deckConfig })
          //   if deleting module
        } else {
          dispatch(deleteModule({ moduleId: matchingModule.id }))
          if (deckConfig != null) {
            dispatch(editDeckConfiguration({ deckConfig }))
          }
        }
      } else {
        const type = getModuleType(value.type as ModuleModel)
        const model = value.type as ModuleModel
        const labwareNotCompatible = getLabwareNotCompatibleWithModule(
          type,
          labwareOnDeck,
          value.cutoutId
        )
        const slot = value.cutoutId.split('cutout')[1]
        //   creating module
        if (labwareNotCompatible == null) {
          dispatch(
            createModule({
              slot,
              model,
              type,
            })
          )
          //   if adding module to slot with incompatible labware
        } else {
          makeSnackbar(
            t('module_incompatible', {
              slot: labwareNotCompatible,
            }) as string
          )
        }
      }
    }
  })
}
