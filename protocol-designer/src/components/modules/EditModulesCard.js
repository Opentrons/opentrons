// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Card } from '@opentrons/components'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  selectors as stepFormSelectors,
  getIsCrashablePipetteSelected,
} from '../../step-forms'
import { selectors as featureFlagSelectors } from '../../feature-flags'
import { SUPPORTED_MODULE_TYPES } from '../../modules'
import { CrashInfoBox } from './CrashInfoBox'
import { ModuleRow } from './ModuleRow'
import styles from './styles.css'
import type { ModuleRealType } from '@opentrons/shared-data'
import type { ModulesForEditModulesCard } from '../../step-forms'

type Props = {
  modules: ModulesForEditModulesCard,
  thermocyclerEnabled: ?boolean,
  openEditModuleModal: (moduleType: ModuleRealType, moduleId?: string) => mixed,
}

export function EditModulesCard(props: Props) {
  const { modules, thermocyclerEnabled, openEditModuleModal } = props

  const visibleModules = thermocyclerEnabled
    ? SUPPORTED_MODULE_TYPES
    : SUPPORTED_MODULE_TYPES.filter(m => m !== THERMOCYCLER_MODULE_TYPE)

  const pipettesByMount = useSelector(
    stepFormSelectors.getPipettesForEditPipetteForm
  )

  const moduleRestrictionsDisabled = Boolean(
    useSelector(featureFlagSelectors.getDisableModuleRestrictions)
  )
  const crashablePipettesSelected = getIsCrashablePipetteSelected(
    pipettesByMount
  )

  const warningsEnabled =
    !moduleRestrictionsDisabled && crashablePipettesSelected
  const showCrashInfoBox =
    warningsEnabled &&
    (modules[MAGNETIC_MODULE_TYPE] || modules[TEMPERATURE_MODULE_TYPE])

  return (
    <Card title="Modules">
      <div className={styles.modules_card_content}>
        {showCrashInfoBox && (
          <CrashInfoBox
            magnetOnDeck={Boolean(modules[MAGNETIC_MODULE_TYPE])}
            temperatureOnDeck={Boolean(modules[TEMPERATURE_MODULE_TYPE])}
          />
        )}
        {visibleModules.map((moduleType, i) => {
          const moduleData = modules[moduleType]
          if (moduleData) {
            return (
              <ModuleRow
                type={moduleType}
                module={moduleData}
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
