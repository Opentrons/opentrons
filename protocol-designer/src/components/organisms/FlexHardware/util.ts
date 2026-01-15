import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getModuleType,
  getSlotDisplayNameFromAAWithFakes,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  replaceCutoutFixtureWithComboFixture,
  THERMOCYCLER_V2_REAR_FIXTURE,
  FLEX_CUTOUT_BY_SLOT_ID,
  COMBO_FIXTURES,
  TRASH_BIN_FIXTURE,
  WASTE_CHUTE_FIXTURES,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'

import { deleteModule } from '/protocol-designer/modules'
import {
  createModule,
  editDeckConfiguration,
} from '/protocol-designer/step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '/protocol-designer/step-forms/actions/additionalItems'

import {
  getModuleModel,
} from '../HardwareConfigurator/utils'
import { getLabwareNotCompatibleWithModule, getSlotHasLabware } from '../utils'
import { getHardwareInSlotInUse } from './getHardwareInSlotInUse'

import type { Dispatch, SetStateAction } from 'react'
import type {
  AddressableAreaName,
  CutoutConfigMap,
  DeckConfiguration,
} from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  SavedStepFormState,
} from '/protocol-designer/step-forms'
import type { ThunkDispatch } from '/protocol-designer/types'
import type { MakeSnackbar } from '../Kitchen/KitchenContext'

interface UpdateInitialDeckSetupProps {
  values: CutoutConfigMap[]
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
  console.log('values in updateInitialDeckState', values)
  console.log('deckConfig in updateInitialDeckState', deckConfig)
  const deckConfigWithAA = replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(deckConfig ?? [])
  const updatedAddedCutoutConfigs = replaceCutoutFixtureWithComboFixture(values, deckConfigWithAA, values[0].cutoutId)
  console.log('updatedAddedCutoutConfigs in updateInitialDeckState', updatedAddedCutoutConfigs)
  const updatedDeckConfig = deckConfig?.map(config => {
    return (
      updatedAddedCutoutConfigs.find(c => c.cutoutId === config.cutoutId) ?? config
    )
  })
  console.log('updatedDeckConfig: ', updatedDeckConfig)
  values.forEach(value => {
    if (value.cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE) {
      return
    }
    const hasLabwareOnSlot = getSlotHasLabware(labwareOnDeck, value.cutoutId)
    // look for the same fixture in the same location
    // const matchingFixture = Object.values(additionalEquipmentOnDeck).find(
    //   ae => ae.name === fixtureName && ae.location === value.cutoutId
    // )
    // get the slot name from the cutout id
    const slotName =
      FLEX_CUTOUT_BY_SLOT_ID[value.cutoutId]

    const matchingModule = Object.values(moduleOnDeck).find(
      module =>
        module.model === getModuleModel(value.addressableAreaId) &&
        getCutoutIdForSlotName(module.slot, deckDef) === value.cutoutId
    )

    // check if there is labware on the slot
    const matching4thColumnLabware =value.cutoutFixtureId in COMBO_FIXTURES
        ? (Object.values(labwareOnDeck).find(labware =>
            labware.stack.includes(slotName)
          ) ?? null)
        : null

    const { moduleId, fixtureIds, fourthColumnSlotLabwareId } =
      getHardwareInSlotInUse(
        savedSteps,
        matching4thColumnLabware,
        matchingModule,
        matchingFixture != null ? [matchingFixture] : undefined
      )

    //  updating fixtures only
    if (fixtureName != null) {
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
          hasLabwareOnSlot && value.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE || value.cutoutFixtureId in WASTE_CHUTE_FIXTURES
        ) {
          makeSnackbar(t('conflict_on_slot_labware_fixture') as string)
        } else {
          dispatch(createDeckFixture(fixtureName, value.cutoutId))
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
        const model = getModuleModel(
          value.addressableAreaId as AddressableAreaName
        )
        const type = model != null ? getModuleType(model) : null
        const labwareNotCompatible =
          type != null
            ? getLabwareNotCompatibleWithModule(
                type,
                labwareOnDeck,
                value.cutoutId
              )
            : null
        const slot = getSlotDisplayNameFromAAWithFakes(value.addressableAreaId)
        //   creating module
        if (labwareNotCompatible == null && model != null && type != null) {
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
