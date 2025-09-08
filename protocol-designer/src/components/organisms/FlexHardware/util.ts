import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  getModuleType,
  THERMOCYCLER_V2_REAR_FIXTURE,
} from '@opentrons/shared-data'

import { deleteModule } from '/protocol-designer/modules'
import { FIXTURES } from '/protocol-designer/pages/Designer/DeckSetup/constants'
import {
  createModule,
  editDeckConfiguration,
} from '/protocol-designer/step-forms/actions'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '/protocol-designer/step-forms/actions/additionalItems'

import { getLabwareNotCompatibleWithModule, getSlotHasLabware } from '../utils'
import { getHardwareInSlotInUse } from './getHardwareInSlotInUse'

import type { Dispatch, SetStateAction } from 'react'
import type { DeckConfiguration, ModuleModel } from '@opentrons/shared-data'
import type {
  AllTemporalPropertiesForTimelineFrame,
  SavedStepFormState,
} from '/protocol-designer/step-forms'
import type { DeckFixture } from '/protocol-designer/step-forms/actions/additionalItems'
import type { ThunkDispatch } from '/protocol-designer/types'
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
  console.log('deckConfig', deckConfig)
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
      ae =>
        ae.name === (value.type as DeckFixture) &&
        ae.location === value.cutoutId
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
          // if (deckConfig != null) {
          //   dispatch(editDeckConfiguration({ deckConfig }))
          // }
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
    } else {
      //  if deleting module in use
      if (matchingModule != null) {
        if (moduleId != null && deckConfig != null) {
          setShowDeleteEntityModal({ ids: [moduleId], deckConfig })
          //   if deleting module
        } else {
          dispatch(deleteModule({ moduleId: matchingModule.id }))
          // if (deckConfig != null) {
          //   dispatch(editDeckConfiguration({ deckConfig }))
          // }
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
