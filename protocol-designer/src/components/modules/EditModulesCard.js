// @flow
import * as React from 'react'
import { Card } from '@opentrons/components'
import ModuleRow from './ModuleRow'
import styles from './styles.css'

import type { ModuleType } from '@opentrons/shared-data'
import type { ModulesForEditModulesCard } from '../../step-forms'

type Props = {
  modules: ModulesForEditModulesCard,
}

// TODO (ka 2019-10-24): This will likely be resused a lot,
// Possble candidate for modules/module-data
const MODULE_TYPES: Array<ModuleType> = ['magdeck', 'tempdeck', 'thermocycler']

export default function EditModulesCard(props: Props) {
  const { modules } = props

  return (
    <Card title="Modules">
      <div className={styles.modules_card_content}>
        {MODULE_TYPES.map((moduleType, i) => {
          const moduleData = modules[moduleType]
          if (moduleData) {
            return <ModuleRow {...moduleData} type={moduleType} key={i} />
          } else {
            return <ModuleRow type={moduleType} key={i} />
          }
        })}
      </div>
    </Card>
  )
}
