// @flow
import * as React from 'react'
import cx from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import { getModuleDisplayName } from '@opentrons/shared-data'
import {
  Modal,
  OutlineButton,
  FormGroup,
  DropdownField,
  HoverTooltip,
} from '@opentrons/components'
import {
  selectors as stepFormSelectors,
  actions as stepFormActions,
  getSlotIsEmpty,
  getSlotsBlockedBySpanning,
} from '../../../step-forms'
import { moveDeckItem } from '../../../labware-ingred/actions'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import {
  SUPPORTED_MODULE_SLOTS,
  getAllModuleSlotsByType,
} from '../../../modules'
import { MODELS_FOR_MODULE_TYPE, THERMOCYCLER } from '../../../constants'
import i18n from '../../../localization'
import { PDAlert } from '../../alerts/PDAlert'
import modalStyles from '../modal.css'
import styles from './EditModules.css'
import type { ModuleType } from '@opentrons/shared-data'

type EditModulesProps = {
  moduleType: ModuleType,
  moduleId: ?string,
  onCloseClick: () => mixed,
}

export default function EditModulesModal(props: EditModulesProps) {
  const { moduleType, onCloseClick } = props
  const _initialDeckSetup = useSelector(stepFormSelectors.getInitialDeckSetup)

  const module = props.moduleId && _initialDeckSetup.modules[props.moduleId]

  const [selectedSlot, setSelectedSlot] = React.useState<string>(
    (module && module.slot) || SUPPORTED_MODULE_SLOTS[moduleType][0].value
  )

  const [selectedModel, setSelectedModel] = React.useState<string>(
    (module && module.model) || 'GEN1'
  )

  const slotsBlockedBySpanning = getSlotsBlockedBySpanning(_initialDeckSetup)
  const previousModuleSlot = module && module.slot

  const slotIsEmpty =
    !slotsBlockedBySpanning.includes(selectedSlot) &&
    (getSlotIsEmpty(_initialDeckSetup, selectedSlot) ||
      previousModuleSlot === selectedSlot)

  const showSlotOption = moduleType !== THERMOCYCLER

  const enableSlotSelection = useSelector(
    featureFlagSelectors.getDisableModuleRestrictions
  )

  const occupiedSlotError =
    !slotIsEmpty && enableSlotSelection ? 'Selected slot is occupied' : null

  const dispatch = useDispatch()

  const handleSlotChange = (e: SyntheticInputEvent<*>) =>
    setSelectedSlot(e.target.value)
  const handleModelChange = (e: SyntheticInputEvent<*>) =>
    setSelectedModel(e.target.value)

  let onSaveClick = () => {
    dispatch(
      stepFormActions.createModule({
        slot: selectedSlot,
        type: moduleType,
        model: selectedModel,
      })
    )
    onCloseClick()
  }
  if (module) {
    onSaveClick = () => {
      // disabled if something lives in the slot selected in local state
      // if previous module.model is different, edit module
      if (module.model !== selectedModel) {
        module.id &&
          dispatch(
            stepFormActions.editModule({ id: module.id, model: selectedModel })
          )
      }
      // if previous module.slot is different than satate, move deck item
      if (selectedSlot && module.slot !== selectedSlot) {
        module.slot && dispatch(moveDeckItem(module.slot, selectedSlot))
      }
      onCloseClick()
    }
  }

  const heading = getModuleDisplayName(moduleType)

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
      {!slotIsEmpty && (
        <PDAlert
          alertType="warning"
          title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
          description={i18n.t('alert.module_placement.SLOT_OCCUPIED.body')}
        />
      )}
      <form>
        <div className={styles.form_row}>
          <FormGroup label="Model" className={styles.option_model}>
            <DropdownField
              tabIndex={0}
              options={MODELS_FOR_MODULE_TYPE[moduleType]}
              value={selectedModel}
              onChange={handleModelChange}
            />
          </FormGroup>
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
                      error={occupiedSlotError}
                    />
                  </FormGroup>
                </div>
              )}
            </HoverTooltip>
          )}
        </div>
      </form>

      <div className={styles.button_row}>
        <OutlineButton onClick={onCloseClick}>Cancel</OutlineButton>
        <OutlineButton disabled={!slotIsEmpty} onClick={onSaveClick}>
          Save
        </OutlineButton>
      </div>
    </Modal>
  )
}
