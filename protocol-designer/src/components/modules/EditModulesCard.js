// @flow
import { Card } from '@opentrons/components'
import type { ModuleRealType } from '@opentrons/shared-data'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import * as React from 'react'
import { useSelector } from 'react-redux'

import { selectors as featureFlagSelectors } from '../../feature-flags'
import { SUPPORTED_MODULE_TYPES } from '../../modules'
import type { ModulesForEditModulesCard } from '../../step-forms'
import {
  getIsCrashablePipetteSelected,
  selectors as stepFormSelectors,
} from '../../step-forms'
import { CrashInfoBox } from './CrashInfoBox'
import { ModuleRow } from './ModuleRow'
import styles from './styles.css'
import { isModuleWithCollisionIssue } from './utils'

type Props = {
  modules: ModulesForEditModulesCard,
  thermocyclerEnabled: ?boolean,
  openEditModuleModal: (moduleType: ModuleRealType, moduleId?: string) => mixed,
}

export function EditModulesCard(props: Props): React.Node {
  const { modules, thermocyclerEnabled, openEditModuleModal } = props

  const visibleModules = thermocyclerEnabled
    ? SUPPORTED_MODULE_TYPES
    : SUPPORTED_MODULE_TYPES.filter(m => m !== THERMOCYCLER_MODULE_TYPE)

  const pipettesByMount = useSelector(
    stepFormSelectors.getPipettesForEditPipetteForm
  )

  const magneticModuleOnDeck = modules[MAGNETIC_MODULE_TYPE]
  const temperatureModuleOnDeck = modules[TEMPERATURE_MODULE_TYPE]

  const hasCrashableMagneticModule =
    magneticModuleOnDeck &&
    isModuleWithCollisionIssue(magneticModuleOnDeck.model)
  const hasCrashableTempModule =
    temperatureModuleOnDeck &&
    isModuleWithCollisionIssue(temperatureModuleOnDeck.model)

  const moduleRestrictionsDisabled = Boolean(
    useSelector(featureFlagSelectors.getDisableModuleRestrictions)
  )
  const crashablePipettesSelected = getIsCrashablePipetteSelected(
    pipettesByMount
  )

  const warningsEnabled =
    !moduleRestrictionsDisabled && crashablePipettesSelected
  const showCrashInfoBox =
    warningsEnabled && (hasCrashableMagneticModule || hasCrashableTempModule)

  return (
    <Card title="Modules">
      <div className={styles.modules_card_content}>
        {showCrashInfoBox && (
          <CrashInfoBox
            magnetOnDeck={hasCrashableMagneticModule}
            temperatureOnDeck={hasCrashableTempModule}
          />
        )}
        {visibleModules.map((moduleType, i) => {
          const moduleData = modules[moduleType]
          if (moduleData) {
            return (
              <ModuleRow
                type={moduleType}
                moduleOnDeck={moduleData}
                showCollisionWarnings={warningsEnabled}
                key={i}
                openEditModuleModal={openEditModuleModal}
              />
            )
          } else {
            return (
              <ModuleRow
                type={moduleType}
                key={i}
                openEditModuleModal={openEditModuleModal}
              />
            )
          }
        })}
      </div>
    </Card>
  )
}
