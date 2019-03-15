// @flow
import * as React from 'react'
import {FormGroup, IconButton, HoverTooltip} from '@opentrons/components'

import type {StepFieldName} from '../../../../steplist/fieldLevel'
import i18n from '../../../../localization'

import type {FocusHandlers} from '../../types'

import {
  LabwareField,
  WellSelectionField,
} from '../../fields'

import styles from '../../StepEditForm.css'

type Props = {
  className?: ?string,
  collapsed?: ?boolean,
  toggleCollapsed: () => mixed,
  focusHandlers: FocusHandlers,
  prefix: 'aspirate' | 'dispense',
}

const makeAddFieldNamePrefix = (prefix: string) => (fieldName: string): StepFieldName => `${prefix}_${fieldName}`

function SourceDestHeaders (props: Props) {
  const {className, collapsed, toggleCollapsed, focusHandlers, prefix} = props
  const addFieldNamePrefix = makeAddFieldNamePrefix(prefix)
  const labwareLabel = i18n.t(`form.step_edit_form.labwareLabel.${prefix}`)

  return (
    <div className={className}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>{prefix}</span>
        <HoverTooltip
          key={collapsed ? 'collapsed' : 'expanded'} // NOTE: without this key, the IconButton will not re-render unless clicked
          tooltipComponent={i18n.t('tooltip.advanced_settings')}>
          {(hoverTooltipHandlers) => (
            <div {...hoverTooltipHandlers} onClick={toggleCollapsed} className={styles.advanced_settings_button_wrapper}>
              <IconButton className={styles.advanced_settings_button} name="settings" hover={!collapsed} />
            </div>
          )}
        </HoverTooltip>
      </div>
      <div className={styles.form_row}>
        <FormGroup label={labwareLabel}>
          <LabwareField name={addFieldNamePrefix('labware')} {...focusHandlers} />
        </FormGroup>
        <WellSelectionField
          name={addFieldNamePrefix('wells')}
          labwareFieldName={addFieldNamePrefix('labware')}
          pipetteFieldName="pipette"
          {...focusHandlers} />
      </div>
    </div>
  )
}

export default SourceDestHeaders
