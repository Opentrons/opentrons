// @flow
import * as React from 'react'
import { FormGroup } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { LabwareField, WellSelectionField } from '../../fields'
import { AspDispSection } from '../AspDispSection'

import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FocusHandlers } from '../../types'

import styles from '../../StepEditForm.css'

type Props = {
  className?: ?string,
  collapsed?: ?boolean,
  toggleCollapsed: () => mixed,
  focusHandlers: FocusHandlers,
  prefix: 'aspirate' | 'dispense',
}

const makeAddFieldNamePrefix = (prefix: string) => (
  fieldName: string
): StepFieldName => `${prefix}_${fieldName}`

export const SourceDestHeaders = (props: Props) => {
  const { className, collapsed, toggleCollapsed, focusHandlers, prefix } = props
  const addFieldNamePrefix = makeAddFieldNamePrefix(prefix)
  const labwareLabel = i18n.t(`form.step_edit_form.labwareLabel.${prefix}`)

  return (
    <AspDispSection {...{ className, collapsed, toggleCollapsed, prefix }}>
      <div className={styles.form_row}>
        <FormGroup label={labwareLabel}>
          <LabwareField
            name={addFieldNamePrefix('labware')}
            {...focusHandlers}
          />
        </FormGroup>
        <WellSelectionField
          name={addFieldNamePrefix('wells')}
          labwareFieldName={addFieldNamePrefix('labware')}
          pipetteFieldName="pipette"
          {...focusHandlers}
        />
      </div>
    </AspDispSection>
  )
}
