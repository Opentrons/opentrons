// @flow
import * as React from 'react'
import i18n from '../../localization'
import { useSelector } from 'react-redux'
import { selectors as featureFlagSelectors } from '../../feature-flags'
import { LabeledValue, OutlineButton } from '@opentrons/components'
import ModuleDiagram from './ModuleDiagram'
import styles from './styles.css'

import type { ModuleType } from '@opentrons/shared-data'
import type { DeckSlot } from '../../types'

type Props = {
  moduleId?: string,
  slot?: DeckSlot,
  model?: string,
  type: ModuleType,
  openEditModuleModal: (moduleType: ModuleType, moduleId?: string) => mixed,
}

export default function ModuleRow(props: Props) {
  const { type, moduleId, slot, model, openEditModuleModal } = props
  const setCurrentModule = (type: ModuleType, moduleId?: string) => () =>
    openEditModuleModal(type, moduleId)
  const addRemoveText = moduleId ? 'remove' : 'add'
  const handleAddOrRemove = moduleId
    ? () => console.log('remove ' + moduleId)
    : setCurrentModule(type)

  const enableEditModules = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )
  const handleEditModule = setCurrentModule(type, moduleId)

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
            <OutlineButton
              className={styles.module_button}
              onClick={handleEditModule}
              disabled={!enableEditModules}
            >
              Edit
            </OutlineButton>
          )}

          {/* TODO (ka 2019-10-23): onClick needs to set edit modal open
          + pass moduleId for deleting */}
          <OutlineButton
            className={styles.module_button}
            onClick={handleAddOrRemove}
          >
            {addRemoveText}
          </OutlineButton>
        </div>
      </div>
    </div>
  )
}
