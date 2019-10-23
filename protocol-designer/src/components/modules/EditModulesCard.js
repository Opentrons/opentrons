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

const MODULE_TYPES: Array<ModuleType> = ['magdeck', 'tempdeck', 'thermocycler']

export default function EditModulesCard(props: Props) {
  const { modules } = props

  return (
    <Card title="Modules">
      <div className={styles.modules_card_content}>
        {MODULE_TYPES.map((type, i) => {
          const moduleData = modules[type]
          if (moduleData) {
            return <ModuleRow {...moduleData} type={type} key={i} />
          } else {
            return <ModuleRow type={type} key={i} />
          }
        })}
      </div>
    </Card>
  )
}
