// @flow
import * as React from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import {
  SUPPORTED_MODULE_SLOTS,
  getAllModuleSlotsByType,
} from '../../../modules'
import i18n from '../../../localization'
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
  moduleId: ?string,
  onCloseClick: () => mixed,
}

export default function EditModulesModal(props: EditModulesProps) {
  const { moduleType, moduleId, onCloseClick } = props
  /* TODO (ka 2019-10-31): This is a temporary hook workaround so the slot selection 'works'
  Once selectors are in place for modules we can get the previously assigned slot from state
  and have supported slot as fallback for new modules or failure to get slot from module by id */
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(
    SUPPORTED_MODULE_SLOTS[moduleType][0].value || null
  )

  const handleSlotChange = (e: SyntheticInputEvent<*>) =>
    setSelectedSlot(e.target.value)

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

  const enableSlotSelection = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  const slotOptionTooltip = (
    <div className={styles.slot_tooltip}>
      {i18n.t('tooltip.edit_module_modal.slot_selection')}
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
        <FormGroup label="Model" className={styles.option_model}>
          <DropdownField
            tabIndex={0}
            options={[{ name: 'GEN1', value: 'GEN1' }]}
            value={'GEN1'}
            onChange={() => null}
          />
        </FormGroup>
        {/*
      TODO (ka 2019-10-30):
      - This is an initial first pass, since nothings coming from state yet,
      the slot will always default to the supported slot
      */}
        {showSlotOption && (
          <HoverTooltip
            placement="bottom"
            tooltipComponent={enableSlotSelection ? null : slotOptionTooltip}
          >
            {hoverTooltipHandlers => (
              <div {...hoverTooltipHandlers} className={styles.option_slot}>
                <FormGroup label="Position">
                  <DropdownField
                    tabIndex={1}
                    options={getAllModuleSlotsByType(moduleType)}
                    value={selectedSlot}
                    disabled={!enableSlotSelection}
                    onChange={handleSlotChange}
                  />
                </FormGroup>
              </div>
            )}
          </HoverTooltip>
        )}
      </div>

      <div className={styles.button_row}>
        <OutlineButton onClick={onCloseClick}>Cancel</OutlineButton>
        <OutlineButton onClick={onSaveClick}>Save</OutlineButton>
      </div>
    </Modal>
  )
}
