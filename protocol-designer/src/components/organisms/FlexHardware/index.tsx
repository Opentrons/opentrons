import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  FLEX_ROBOT_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  MAGNETIC_BLOCK_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_CUTOUT,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { deleteContainer } from '../../../labware-ingred/actions'
import { deleteModule } from '../../../modules'
import { editDeckConfiguration } from '../../../step-forms/actions'
import { deleteDeckFixture } from '../../../step-forms/actions/additionalItems'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
  getSavedStepForms,
} from '../../../step-forms/selectors'
import { uuid } from '../../../utils'
import { ConfirmDeleteEntityInUseModal } from '../ConfirmDeleteEntityInUseModal'
import { ConfirmDeleteStagingAreaModal } from '../ConfirmDeleteStagingAreaModal'
import { HardwareConfigurator } from '../HardwareConfigurator'
import { useKitchen } from '../Kitchen/hooks'
import { updateInitialDeckState } from './util'

import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
  FlexModuleCutoutFixtureId,
} from '@opentrons/shared-data'
import type { FixtureName, Fixtures } from '..'
import type { ThunkDispatch } from '../../../types'
import type { InitialDeckStateModules } from '../HardwareConfigurator/AddFixtureModal'

export function FlexHardware(): JSX.Element {
  const { t } = useTranslation('protocol_overview')
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const savedSteps = useSelector(getSavedStepForms)
  const { makeSnackbar } = useKitchen()
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const [modalInfo, setShowDeleteEntityModal] = useState<{
    ids: string[]
    deckConfig: DeckConfiguration
  } | null>(null)
  const [stagingAreaModalInfo, setShowDeleteStagingAreaModal] = useState<{
    ids: string[]
    deckConfig: DeckConfiguration
  } | null>(null)
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const hasGripper = Object.values(additionalEquipmentEntities).some(
    ae => ae.name === 'gripper'
  )
  const {
    modules: moduleOnDeck,
    additionalEquipmentOnDeck,
    labware: labwareOnDeck,
  } = initialDeckSetup
  const hasStagingAreaAndWasteChute =
    Object.values(additionalEquipmentOnDeck).filter(
      ae => ae.location === WASTE_CHUTE_CUTOUT
    )?.length === 2

  const fixtures: Fixtures = Object.values(additionalEquipmentOnDeck).reduce(
    (acc: Fixtures, fixture) => {
      let cutoutFixtureId: CutoutFixtureId = TRASH_BIN_ADAPTER_FIXTURE

      //  the stagingArea + magneticBlock combo is added to the modules and
      //  filtered out here
      if (
        fixture.name === 'stagingArea' &&
        Object.values(moduleOnDeck).some(
          module =>
            module.type === MAGNETIC_BLOCK_TYPE &&
            fixture.location.includes(module.slot)
        )
      ) {
        return acc
      }
      //  the stagingArea + wasteChute combo is added only once through wasteChute
      //  and filtered out the 2nd time for stagingArea here
      if (
        hasStagingAreaAndWasteChute &&
        fixture.name === 'stagingArea' &&
        fixture.location === WASTE_CHUTE_CUTOUT
      ) {
        return acc
      }
      if (hasStagingAreaAndWasteChute && fixture.name === 'wasteChute') {
        cutoutFixtureId = STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
      } else if (fixture.name === 'stagingArea') {
        cutoutFixtureId = STAGING_AREA_RIGHT_SLOT_FIXTURE
      } else if (fixture.name === 'wasteChute') {
        cutoutFixtureId = WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE
      }
      acc[fixture.id] = {
        cutoutId: fixture.location as CutoutId,
        name: fixture.name as FixtureName,
        cutoutFixtureId,
      }

      return acc
    },
    {}
  )

  const modules: InitialDeckStateModules = Object.values(moduleOnDeck).reduce(
    (acc, onDeckModule) => {
      let cutoutFixtureId = onDeckModule.model as FlexModuleCutoutFixtureId
      if (
        onDeckModule.type === MAGNETIC_BLOCK_TYPE &&
        Object.values(additionalEquipmentOnDeck).some(
          ae =>
            ae.name === 'stagingArea' && ae.location.includes(onDeckModule.slot)
        )
      ) {
        cutoutFixtureId = STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
      }
      const module = {
        [uuid()]: {
          ...onDeckModule,
          cutoutId: getCutoutIdForSlotName(onDeckModule.slot, deckDef),
          cutoutFixtureId,
        },
      }

      return { ...acc, ...module }
    },
    {}
  )
  const handleConfirmDeleteEntity = (modalInfo: {
    ids: string[]
    deckConfig: DeckConfiguration
  }): void => {
    modalInfo.ids.forEach(item => {
      if (moduleOnDeck[item] != null) {
        dispatch(deleteModule({ moduleId: item }))
      } else if (labwareOnDeck[item] != null) {
        dispatch(deleteContainer({ labwareId: item }))
      } else {
        dispatch(deleteDeckFixture(item))
      }
      dispatch(editDeckConfiguration({ deckConfig: modalInfo.deckConfig }))
      setShowDeleteEntityModal(null)
    })
  }

  const handleConfirmDeleteStagingArea = (stagingAreaModalInfo: {
    ids: string[]
    deckConfig: DeckConfiguration
  }): void => {
    stagingAreaModalInfo.ids.forEach(item => {
      if (labwareOnDeck[item] != null) {
        dispatch(deleteContainer({ labwareId: item }))
      } else {
        dispatch(deleteDeckFixture(item))
      }
      dispatch(
        editDeckConfiguration({
          deckConfig: stagingAreaModalInfo.deckConfig,
        })
      )
      setShowDeleteStagingAreaModal(null)
    })
  }

  return (
    <>
      {modalInfo != null ? (
        <ConfirmDeleteEntityInUseModal
          onClose={() => {
            setShowDeleteEntityModal(null)
          }}
          onConfirm={() => {
            handleConfirmDeleteEntity(modalInfo)
          }}
        />
      ) : null}
      {stagingAreaModalInfo != null ? (
        <ConfirmDeleteStagingAreaModal
          onClose={() => {
            setShowDeleteStagingAreaModal(null)
          }}
          onConfirm={() => {
            handleConfirmDeleteStagingArea(stagingAreaModalInfo)
          }}
        />
      ) : null}
      <HardwareConfigurator
        modules={modules}
        fixtures={fixtures}
        hasGripper={hasGripper}
        updateInitialDeckState={(value, deckConfig) => {
          updateInitialDeckState({
            values: value,
            initialDeckSetup,
            dispatch,
            setShowDeleteEntityModal,
            setShowDeleteStagingAreaModal,
            savedSteps,
            makeSnackbar,
            t,
            deckConfig,
          })
        }}
      />
    </>
  )
}
