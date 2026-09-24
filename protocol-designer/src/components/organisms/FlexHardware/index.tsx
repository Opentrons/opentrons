import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getCutoutIdForSlotName,
  getDeckDefFromRobotType,
  MAGNETIC_BLOCK_TYPE,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'

import { deleteContainer } from '/protocol-designer/labware-ingred/actions'
import { deleteModule } from '/protocol-designer/modules'
import { editDeckConfiguration } from '/protocol-designer/step-forms/actions'
import { deleteDeckFixture } from '/protocol-designer/step-forms/actions/additionalItems'
import {
  getAdditionalEquipmentEntities,
  getInitialDeckSetup,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { uuid } from '/protocol-designer/utils'

import { ConfirmDeleteEntityInUseModal } from '../ConfirmDeleteEntityInUseModal'
import { ConfirmDeleteStagingAreaModal } from '../ConfirmDeleteStagingAreaModal'
import { HardwareConfigurator } from '../HardwareConfigurator'
import { useKitchen } from '../Kitchen/useKitchen'
import { updateInitialDeckState } from './util'

import type { ReactNode } from 'react'
import type {
  CutoutFixtureId,
  CutoutId,
  DeckConfiguration,
  FlexModuleCutoutFixtureId,
} from '@opentrons/shared-data'
import type { ModuleOnDeck } from '/protocol-designer/step-forms'
import type { ThunkDispatch } from '/protocol-designer/types'
import type { FixtureName, Fixtures } from '..'
import type { InitialDeckStateModules } from '../HardwareConfigurator/AddFixtureModal'

export function FlexHardware(): ReactNode {
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

  const fixtures: Fixtures = Object.values(additionalEquipmentOnDeck).reduce(
    (acc: Fixtures, fixture) => {
      let cutoutFixtureId: CutoutFixtureId = TRASH_BIN_ADAPTER_FIXTURE

      if (fixture.name === 'stagingArea') {
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
  const handleDeleteStackerLabware = (module: ModuleOnDeck): void => {
    if (module.moduleState.type === FLEX_STACKER_MODULE_TYPE) {
      // delete hopper labware
      for (const labwareGroup of module.moduleState.labwareInHopper ?? []) {
        for (const labwareId of Object.values(labwareGroup)) {
          if (labwareId != null) {
            dispatch(deleteContainer({ labwareId, stacker: module }))
          }
        }
      }
      // delete shuttle labware
      if (module.moduleState.labwareOnShuttle != null) {
        for (const labwareId of Object.values(
          module.moduleState.labwareOnShuttle
        )) {
          if (labwareId != null) {
            dispatch(deleteContainer({ labwareId, stacker: module }))
          }
        }
      }
    }
  }

  const handleConfirmDeleteEntity = (modalInfo: {
    ids: string[]
    deckConfig: DeckConfiguration
  }): void => {
    modalInfo.ids.forEach(item => {
      if (moduleOnDeck[item] != null) {
        if (moduleOnDeck[item].type === FLEX_STACKER_MODULE_TYPE) {
          handleDeleteStackerLabware(moduleOnDeck[item])
        }
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
            handleDeleteStackerLabware,
          })
        }}
      />
    </>
  )
}
