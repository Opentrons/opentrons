// @flow
import * as React from 'react'
import {
  LabeledValue,
  OutlineButton,
  SlotMap,
  HoverTooltip,
} from '@opentrons/components'
import { i18n } from '../../localization'
import { useDispatch } from 'react-redux'
import { actions as stepFormActions } from '../../step-forms'

import { ModuleDiagram } from './ModuleDiagram'
import {
  SPAN7_8_10_11_SLOT,
  DEFAULT_MODEL_FOR_MODULE_TYPE,
} from '../../constants'
import { isVersionOneModule } from './'
import styles from './styles.css'

import type { ModuleRealType } from '@opentrons/shared-data'
import type { ModuleOnDeck } from '../../step-forms'

type Props = {
  module?: ModuleOnDeck,
  showCollisionWarnings?: boolean,
  type: ModuleRealType,
  openEditModuleModal: (moduleType: ModuleRealType, moduleId?: string) => mixed,
}

export function ModuleRow(props: Props) {
  const { module, openEditModuleModal, showCollisionWarnings } = props
  const type: ModuleRealType = module?.type || props.type

  const model = module?.model
  const slot = module?.slot

  /*
  TODO (ka 2020-2-3): This logic is very specific to this individual implementation
  of SlotMap. Kept it here (for now?) because it spells out the different cases.
  */
  let slotDisplayName = null
  let occupiedSlotsForMap: Array<string> = []
  let collisionSlots: Array<string> = []
  const versionOneModel = model ? isVersionOneModule(model) : false
  // Populate warnings are enabled (crashable pipette in protocol + !disable module restrictions)
  if (showCollisionWarnings && versionOneModel && slot === '1') {
    collisionSlots = ['4']
  } else if (showCollisionWarnings && versionOneModel && slot === '3') {
    collisionSlots = ['6']
  }

  // If this module is in a deck slot + is not TC spanning Slot
  // add to occupiedSlots
  if (slot && slot !== SPAN7_8_10_11_SLOT) {
    slotDisplayName = `Slot ${slot}`
    occupiedSlotsForMap = [slot]
  }
  // If this Module is a TC deck slot and spanning
  // populate all 4 slots individually
  if (slot === SPAN7_8_10_11_SLOT) {
    slotDisplayName = 'Slot 7'
    occupiedSlotsForMap = ['7', '8', '10', '11']
  }

  // If collisionSlots are populated, check which slot is occupied
  // and render module specific crash warning. This logic assumes
  // default module slot placement magnet = Slot1 temperature = Slot3
  let collisionTooltipText = null
  if (collisionSlots && collisionSlots.includes('4')) {
    collisionTooltipText = i18n.t(
      `tooltip.edit_module_card.magnetic_module_collision`
    )
  } else if (collisionSlots && collisionSlots.includes('6')) {
    collisionTooltipText = i18n.t(
      `tooltip.edit_module_card.temperature_module_collision`
    )
  }

  const collisionTooltip = collisionTooltipText && (
    <div className={styles.collision_tolltip}>{collisionTooltipText}</div>
  )

  const setCurrentModule = (
    moduleType: ModuleRealType,
    moduleId?: string
  ) => () => openEditModuleModal(moduleType, moduleId)

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
          <ModuleDiagram
            type={type}
            model={module?.model || DEFAULT_MODEL_FOR_MODULE_TYPE[type]}
          />
        </div>
        <div className={styles.module_col}>
          {model && (
            <LabeledValue
              label="Model"
              value={i18n.t(`modules.model_display_name.${model}`)}
            />
          )}
        </div>
        <div className={styles.module_col}>
          {slot && <LabeledValue label="Position" value={slotDisplayName} />}
        </div>
        <div className={styles.slot_map}>
          {slot && (
            <HoverTooltip
              placement="bottom"
              tooltipComponent={
                collisionSlots.length > 0 ? collisionTooltip : null
              }
            >
              {hoverTooltipHandlers => (
                <div {...hoverTooltipHandlers}>
                  <SlotMap
                    occupiedSlots={occupiedSlotsForMap}
                    collisionSlots={collisionSlots}
                  />
                </div>
              )}
            </HoverTooltip>
          )}
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
