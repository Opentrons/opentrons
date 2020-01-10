// @flow
import * as React from 'react'
import { Card } from '@opentrons/components'
import ModuleRow from './ModuleRow'
import styles from './styles.css'

import type { ModuleType } from '@opentrons/shared-data'
import { SUPPORTED_MODULE_TYPES } from '../../modules'
import { THERMOCYCLER } from '../../constants'
import type { ModulesForEditModulesCard } from '../../step-forms'
type Props = {
  modules: ModulesForEditModulesCard,
  thermocyclerEnabled: ?boolean,
  openEditModuleModal: (moduleType: ModuleType, moduleId?: string) => mixed,
}

export default function EditModulesCard(props: Props) {
  const { modules, thermocyclerEnabled, openEditModuleModal } = props

  const visibleModules = thermocyclerEnabled
    ? SUPPORTED_MODULE_TYPES
    : SUPPORTED_MODULE_TYPES.filter(m => m !== THERMOCYCLER)

  return (
    <Card title="Modules">
      <div className={styles.modules_card_content}>
        {visibleModules.map((moduleType, i) => {
          const moduleData = modules[moduleType]
          if (moduleData) {
            return (
              <ModuleRow
                type={moduleType}
                module={moduleData}
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
