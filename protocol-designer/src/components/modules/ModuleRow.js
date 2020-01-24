// @flow
import * as React from 'react'
import { i18n } from '../../localization'
import { useDispatch } from 'react-redux'
import { actions as stepFormActions } from '../../step-forms'

import { LabeledValue, OutlineButton } from '@opentrons/components'
import { ModuleDiagram } from './ModuleDiagram'
import { SPAN7_8_10_11_SLOT } from '../../constants'
import styles from './styles.css'

import type { ModuleType } from '@opentrons/shared-data'
import type { ModuleOnDeck } from '../../step-forms'

type Props = {
  module?: ModuleOnDeck,
  type: ModuleType,
  openEditModuleModal: (moduleType: ModuleType, moduleId?: string) => mixed,
}

export function ModuleRow(props: Props) {
  const { module, openEditModuleModal } = props
  const type = module?.type || props.type

  const model = module?.model
  const slot = module?.slot

  let slotDisplayName = null
  if (slot) {
    slotDisplayName = `Slot ${slot}`
  }
  if (slot === SPAN7_8_10_11_SLOT) {
    slotDisplayName = 'Slot 7'
  }

  const setCurrentModule = (moduleType: ModuleType, moduleId?: string) => () =>
    openEditModuleModal(moduleType, moduleId)

  const addRemoveText = module ? 'remove' : 'add'

  const dispatch = useDispatch()

  const handleAddOrRemove = module
    ? () => dispatch(stepFormActions.deleteModule(module.id))
    : setCurrentModule(type)

  const handleEditModule = module && setCurrentModule(type, module.id)

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
          {slot && <LabeledValue label="Position" value={slotDisplayName} />}
        </div>
        <div className={styles.modules_button_group}>
          {module && (
            <OutlineButton
              className={styles.module_button}
              onClick={handleEditModule}
            >
              Edit
            </OutlineButton>
          )}
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
