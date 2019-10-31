// @flow
import * as React from 'react'
import { Card } from '@opentrons/components'
import ModuleRow from './ModuleRow'
import styles from './styles.css'

import type { ModuleType } from '@opentrons/shared-data'
import { SUPPORTED_MODULE_TYPES } from '../../modules'
import type { ModulesForEditModulesCard } from '../../step-forms'

type Props = {
  modules: ModulesForEditModulesCard,
  openEditModuleModal: (type: ModuleType, moduleId?: string) => mixed,
}

export default function EditModulesCard(props: Props) {
  const { modules, openEditModuleModal } = props

  return (
    <Card title="Modules">
      <div className={styles.modules_card_content}>
        {SUPPORTED_MODULE_TYPES.map((moduleType, i) => {
          const moduleData = modules[moduleType]
          if (moduleData) {
            return (
              <ModuleRow
                {...moduleData}
                type={moduleType}
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
