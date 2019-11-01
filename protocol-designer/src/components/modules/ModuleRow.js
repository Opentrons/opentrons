// @flow
import * as React from 'react'
import i18n from '../../localization'
import { useSelector, useDispatch } from 'react-redux'
import { actions as stepFormActions } from '../../step-forms'
import { selectors as featureFlagSelectors } from '../../feature-flags'
import { LabeledValue, OutlineButton } from '@opentrons/components'
import ModuleDiagram from './ModuleDiagram'
import styles from './styles.css'

import type { ModuleType } from '@opentrons/shared-data'
import type { ModuleOnDeck } from '../../step-forms'

type Props = {
  module?: ModuleOnDeck,
  type: ModuleType,
  openEditModuleModal: (moduleType: ModuleType, id?: string) => mixed,
}

export default function ModuleRow(props: Props) {
  const { module, openEditModuleModal } = props
  const type = module?.type || props.type

  const model = module?.model
  const id = module?.id
  const slot = module?.slot

  let slotDisplayName = null
  if (slot) {
    slotDisplayName = `Slot ${slot}`
  } else if (slot === 'span7_8_10_11') {
    slotDisplayName = 'Slot 7'
  }

  const setCurrentModule = (type: ModuleType, id?: string) => () =>
    openEditModuleModal(type, id)

  const addRemoveText = module ? 'remove' : 'add'

  const dispatch = useDispatch()

  const handleAddOrRemove = module
    ? () => dispatch(stepFormActions.deleteModule(module.id))
    : setCurrentModule(type)

  const enableEditModules = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )
  const handleEditModule = setCurrentModule(type, id)

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
          {slot && <LabeledValue label="Slot" value={slotDisplayName} />}
        </div>
        <div className={styles.modules_button_group}>
          {id && (
            <OutlineButton
              className={styles.module_button}
              onClick={handleEditModule}
              disabled={!enableEditModules}
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
