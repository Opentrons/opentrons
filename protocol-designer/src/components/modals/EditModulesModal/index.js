// @flow
import * as React from 'react'
import cx from 'classnames'
import { getModuleDisplayName } from '@opentrons/shared-data'
import {
  Modal,
  OutlineButton,
  FormGroup,
  DropdownField,
  HoverTooltip,
} from '@opentrons/components'
import styles from './EditModules.css'
import modalStyles from '../modal.css'

import type { ModuleType } from '@opentrons/shared-data'

type EditModulesProps = {
  moduleType: ModuleType,
  moduleId?: string,
  onCloseClick: () => mixed,
}
export default function EditModulesModal(props: EditModulesProps) {
  const { moduleType, moduleId, onCloseClick } = props

  let onSaveClick = () => {
    moduleType && console.log('add module ' + moduleType)
    onCloseClick()
  }
  if (moduleId) {
    onSaveClick = () => {
      console.log('update module ' + moduleId)
      onCloseClick()
    }
  }

  const heading = getModuleDisplayName(moduleType)
  const showSlotOption = moduleType !== 'thermocycler'

  const slotOptionTooltip = (
    <div className={styles.slot_tooltip}>
      To enable non-default/unrestricted positioning, go to Settings &gt; App
      &gt; Experimental settings.
    </div>
  )
  return (
    <Modal
      heading={heading}
      className={cx(modalStyles.modal, styles.edit_module_modal)}
      contentsClassName={styles.modal_contents}
    >
      <div className={styles.form_row}>
        {/*
      TODO (ka 2019-10-29): This field is enabled, but only GEN1 available for now
      - onChange returns null because onChange is required by DropdownFields
      */}
        <FormGroup label="Model" className={styles.form_option}>
          <DropdownField
            tabIndex={0}
            options={[{ name: 'GEN1', value: 'GEN1' }]}
            value={'GEN1'}
            onChange={() => null}
          />
        </FormGroup>
        {showSlotOption && (
          <FormGroup label="Position" className={styles.form_option}>
            <HoverTooltip
              placement="bottom"
              tooltipComponent={slotOptionTooltip}
            >
              {hoverTooltipHandlers => (
                <div {...hoverTooltipHandlers}>
                  <DropdownField
                    tabIndex={1}
                    options={SUPPORTED_MODULE_SLOTS[moduleType]}
                    value={'GEN1'}
                    disabled
                    onChange={() => null}
                  />
                </div>
              )}
            </HoverTooltip>
          </FormGroup>
        )}
      </div>

      <div className={styles.button_row}>
        <OutlineButton onClick={onCloseClick}>Cancel</OutlineButton>
        <OutlineButton onClick={onSaveClick}>Save</OutlineButton>
      </div>
    </Modal>
  )
}

// TODO (ka 2019-10-29): Not sure where this should ultimately live,
// but hardcoding here for now since this is the only place it will be used
// Will update with all slots when implementing FF in next PR
const SUPPORTED_MODULE_SLOTS = {
  magdeck: [{ name: 'Slot 1 (supported)', value: '1' }],
  tempdeck: [{ name: 'Slot 3 (supported)', value: '3' }],
  thermocycler: [],
}
