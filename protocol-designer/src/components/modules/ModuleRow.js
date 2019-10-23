// @flow
import * as React from 'react'
import i18n from '../../localization'

import { LabeledValue, OutlineButton } from '@opentrons/components'
import ModuleDiagram from './ModuleDiagram'
import styles from './styles.css'

import type { ModuleType } from '@opentrons/shared-data'

type Props = {
  moduleId?: string,
  slot?: string, // TODO make this PD specific slot type with spans
  model?: string,
  type: ModuleType,
}

export default function ModuleRow(props: Props) {
  const { type, moduleId, slot, model } = props
  const addRemoveText = moduleId ? 'remove' : 'add'
  return (
    <div>
      <h4 className={styles.row_title}>
        {i18n.t(`modules.module_display_names.${type}`)}
      </h4>
      <div className={styles.module_row}>
        <div className={styles.module_diagram_container}>
          <ModuleDiagram type={type} />
        </div>
        <div className={styles.module_col}>
          {model && <LabeledValue label="Model" value={model} />}
        </div>
        <div className={styles.module_col}>
          {slot && <LabeledValue label="Slot" value={`Slot ${slot}`} />}
        </div>
        <div className={styles.modules_button_group}>
          {/* TODO (ka 2019-10-23): Hide/Show based on anySlot FF when in place
          onClick needs to set edit modal open + pass moduleId for deleting */}
          {moduleId && (
            <OutlineButton className={styles.module_button} disabled>
              Edit
            </OutlineButton>
          )}

          {/* TODO (ka 2019-10-23): onClick needs to set edit modal open
          + pass moduleId for deleting */}
          <OutlineButton className={styles.module_button}>
            {addRemoveText}
          </OutlineButton>
        </div>
      </div>
    </div>
  )
}
