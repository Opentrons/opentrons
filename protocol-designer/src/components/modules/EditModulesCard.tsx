import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Card, SPACING } from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  FLEX_ROBOT_TYPE,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'
import {
  selectors as stepFormSelectors,
  getIsCrashablePipetteSelected,
} from '../../step-forms'
import { selectors as featureFlagSelectors } from '../../feature-flags'
import { SUPPORTED_MODULE_TYPES } from '../../modules'
import { getAdditionalEquipment } from '../../step-forms/selectors'
import {
  deleteDeckFixture,
  toggleIsGripperRequired,
} from '../../step-forms/actions/additionalItems'
import { getRobotType } from '../../file-data/selectors'
import { CrashInfoBox } from './CrashInfoBox'
import { ModuleRow } from './ModuleRow'
import { AdditionalItemsRow } from './AdditionalItemsRow'
import { isModuleWithCollisionIssue } from './utils'
import { StagingAreasRow } from './StagingAreasRow'
import { MultipleModulesRow } from './MultipleModulesRow'

import type { AdditionalEquipmentEntity } from '@opentrons/step-generation'
import type { ModuleType, PipetteName } from '@opentrons/shared-data'
import type { ModulesForEditModulesCard } from '../../step-forms'

import styles from './styles.module.css'
export interface Props {
  modules: ModulesForEditModulesCard
  openEditModuleModal: (moduleType: ModuleType, moduleId?: string) => void
}

export function EditModulesCard(props: Props): JSX.Element {
  const { modules, openEditModuleModal } = props

  const pipettesByMount = useSelector(
    stepFormSelectors.getPipettesForEditPipetteForm
  )
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const trashBin = Object.values(additionalEquipment).find(
    equipment => equipment?.name === 'trashBin'
  )
  const isGripperAttached = Object.values(additionalEquipment).some(
    equipment => equipment?.name === 'gripper'
  )
  const wasteChute = Object.values(additionalEquipment).find(
    equipment => equipment?.name === 'wasteChute'
  )
  const stagingAreas: AdditionalEquipmentEntity[] = Object.values(
    additionalEquipment
  ).filter(equipment => equipment?.name === 'stagingArea')

  const dispatch = useDispatch()
  const robotType = useSelector(getRobotType)

  const magneticModuleOnDeck = modules[MAGNETIC_MODULE_TYPE]
  const temperatureModuleOnDeck = modules[TEMPERATURE_MODULE_TYPE]
  const heaterShakerOnDeck = modules[HEATERSHAKER_MODULE_TYPE]

  const crashablePipetteSelected = getIsCrashablePipetteSelected(
    pipettesByMount
  )
  const hasCrashableMagneticModule =
    magneticModuleOnDeck &&
    isModuleWithCollisionIssue(magneticModuleOnDeck[0].model)
  const hasCrashableTempModule =
    temperatureModuleOnDeck &&
    isModuleWithCollisionIssue(temperatureModuleOnDeck[0].model)
  const isHeaterShakerOnDeck = Boolean(heaterShakerOnDeck)

  const showTempPipetteCollisons =
    crashablePipetteSelected && hasCrashableTempModule
  const showMagPipetteCollisons =
    crashablePipetteSelected && hasCrashableMagneticModule

  const moduleRestrictionsDisabled = Boolean(
    useSelector(featureFlagSelectors.getDisableModuleRestrictions)
  )
  const enableAbsorbanceReader = Boolean(
    useSelector(featureFlagSelectors.getEnableAbsorbanceReader)
  )

  const showHeaterShakerPipetteCollisions =
    isHeaterShakerOnDeck &&
    [
      getPipetteSpecsV2(pipettesByMount.left.pipetteName as PipetteName),
      getPipetteSpecsV2(pipettesByMount.right.pipetteName as PipetteName),
    ].some(pipetteSpecs => pipetteSpecs?.channels !== 1)

  const warningsEnabled = !moduleRestrictionsDisabled
  const isFlex = robotType === FLEX_ROBOT_TYPE

  const SUPPORTED_MODULE_TYPES_FILTERED = SUPPORTED_MODULE_TYPES.filter(
    moduleType =>
      isFlex
        ? moduleType !== 'magneticModuleType'
        : moduleType !== 'magneticBlockType'
  ).filter(moduleType =>
    enableAbsorbanceReader ? true : moduleType !== 'absorbanceReaderType'
  )

  const handleDeleteStagingAreas = (): void => {
    stagingAreas.forEach(stagingArea => {
      dispatch(deleteDeckFixture(stagingArea.id))
    })
  }

  return (
    <Card title={isFlex ? 'Additional Items' : 'Modules'}>
      <div className={styles.modules_card_content}>
        {warningsEnabled && !isFlex && (
          <CrashInfoBox
            showMagPipetteCollisons={showMagPipetteCollisons}
            showTempPipetteCollisons={showTempPipetteCollisons}
            showHeaterShakerLabwareCollisions={isHeaterShakerOnDeck}
            showHeaterShakerModuleCollisions={isHeaterShakerOnDeck}
            showHeaterShakerPipetteCollisions={
              showHeaterShakerPipetteCollisions
            }
          />
        )}
        {isFlex ? (
          <Box paddingBottom={SPACING.spacing16}>
            <AdditionalItemsRow
              handleAttachment={() => dispatch(toggleIsGripperRequired())}
              isEquipmentAdded={isGripperAttached}
              name="gripper"
            />
          </Box>
        ) : null}
        {SUPPORTED_MODULE_TYPES_FILTERED.map((moduleType, i) => {
          const moduleData = modules[moduleType]
          if (moduleData != null && moduleData.length === 1) {
            return (
              <ModuleRow
                type={moduleType}
                moduleOnDeck={moduleData[0]}
                showCollisionWarnings={warningsEnabled}
                key={`${moduleType}_${i}`}
                openEditModuleModal={openEditModuleModal}
                robotType={robotType}
              />
            )
          } else if (moduleData != null && moduleData.length > 1) {
            return (
              <MultipleModulesRow
                moduleType={moduleType}
                moduleOnDeck={moduleData}
                key={`${moduleType}_${i}`}
                moduleOnDeckType={moduleData[0].type}
                moduleOnDeckModel={moduleData[0].model}
                openEditModuleModal={openEditModuleModal}
              />
            )
          } else {
            return (
              <ModuleRow
                type={moduleType}
                key={`noModule_${i}`}
                openEditModuleModal={openEditModuleModal}
              />
            )
          }
        })}
        {isFlex ? (
          <>
            <StagingAreasRow
              handleAttachment={handleDeleteStagingAreas}
              stagingAreas={stagingAreas}
            />
            <AdditionalItemsRow
              handleAttachment={() =>
                trashBin != null
                  ? dispatch(deleteDeckFixture(trashBin.id))
                  : null
              }
              isEquipmentAdded={trashBin != null}
              name="trashBin"
              hasWasteChute={wasteChute != null}
              trashBinSlot={trashBin?.location ?? undefined}
              trashBinId={trashBin?.id}
            />
            <AdditionalItemsRow
              handleAttachment={() => {
                if (wasteChute != null)
                  dispatch(deleteDeckFixture(wasteChute.id))
              }}
              isEquipmentAdded={wasteChute != null}
              name="wasteChute"
              hasWasteChute={wasteChute != null}
              trashBinId={trashBin?.id}
            />
          </>
        ) : null}
      </div>
    </Card>
  )
}
