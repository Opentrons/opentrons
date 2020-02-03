// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Card } from '@opentrons/components'
import {
  selectors as stepFormSelectors,
  getCrashablePipetteSelected,
} from '../../step-forms'
import { selectors as featureFlagSelectors } from '../../feature-flags'
import { SUPPORTED_MODULE_TYPES } from '../../modules'
import { THERMOCYCLER } from '../../constants'
import { CrashInfoBox } from './CrashInfoBox'
import { ModuleRow } from './ModuleRow'
import styles from './styles.css'
import type { ModuleType } from '@opentrons/shared-data'
import type { ModulesForEditModulesCard } from '../../step-forms'

type Props = {
  modules: ModulesForEditModulesCard,
  thermocyclerEnabled: ?boolean,
  openEditModuleModal: (moduleType: ModuleType, moduleId?: string) => mixed,
}

export function EditModulesCard(props: Props) {
  const { modules, thermocyclerEnabled, openEditModuleModal } = props

  const visibleModules = thermocyclerEnabled
    ? SUPPORTED_MODULE_TYPES
    : SUPPORTED_MODULE_TYPES.filter(m => m !== THERMOCYCLER)

  const pipettesByMount = useSelector(
    stepFormSelectors.getPipettesForEditPipetteForm
  )

  const moduleRestritionsDisabled = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )
  const crashablePipettesSelected = getCrashablePipetteSelected(pipettesByMount)

  const warningsEnabled =
    Boolean(moduleRestritionsDisabled) && crashablePipettesSelected
  const showCrashInfoBox =
    warningsEnabled && (modules.magdeck || modules.tempdeck)

  return (
    <Card title="Modules">
      <div className={styles.modules_card_content}>
        {showCrashInfoBox && (
          <CrashInfoBox
            magnetOnDeck={Boolean(modules.magdeck)}
            temperatureOnDeck={Boolean(modules.tempdeck)}
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
