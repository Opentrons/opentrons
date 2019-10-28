// @flow
import * as React from 'react'
import { Modal, OutlineButton } from '@opentrons/components'
import styles from './EditModules.css'
import type { ModuleType } from '@opentrons/shared-data'

type EditModulesProps = {
  moduleType: ModuleType,
  moduleId?: string,
  onCloseClick: () => mixed,
}
export default function EditModulesModal(props: EditModulesProps) {
  const { moduleType, moduleId, onCloseClick } = props
  const onSaveClick = moduleId
    ? () => moduleId && console.log('update module ' + moduleId)
    : () => moduleType && console.log('add module ' + moduleType)
  const heading = `${moduleType}` || ''
  return (
    <Modal heading={heading} className={styles.edit_module_modal}>
      <h2>{moduleType}</h2>
      <div className={styles.button_row}>
        <OutlineButton onClick={onCloseClick}>Cancel</OutlineButton>
        <OutlineButton onClick={onSaveClick} disabled>
          Save
        </OutlineButton>
      </div>
    </Modal>
  )
}
