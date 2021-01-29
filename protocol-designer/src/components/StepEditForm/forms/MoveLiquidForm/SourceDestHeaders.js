// @flow
import * as React from 'react'
import { FormGroup } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { LabwareField, WellSelectionField } from '../../fields'
import { AspDispSection } from '../AspDispSection'
import type { FieldPropsByName } from '../../fields/useSingleEditFieldProps'
import type { StepFieldName } from '../../../../steplist/fieldLevel'

import styles from '../../StepEditForm.css'

type Props = {|
  className?: ?string,
  collapsed?: ?boolean,
  toggleCollapsed: () => void,
  prefix: 'aspirate' | 'dispense',
  propsForFields: FieldPropsByName,
|}

const makeAddFieldNamePrefix = (prefix: string) => (
  fieldName: string
): StepFieldName => `${prefix}_${fieldName}`

export const SourceDestHeaders = (props: Props): React.Node => {
  const {
    className,
    collapsed,
    toggleCollapsed,
    prefix,
    propsForFields,
  } = props
  const addFieldNamePrefix = makeAddFieldNamePrefix(prefix)
  const labwareLabel = i18n.t(`form.step_edit_form.labwareLabel.${prefix}`)

  return (
    <AspDispSection {...{ className, collapsed, toggleCollapsed, prefix }}>
      <div className={styles.form_row}>
        <FormGroup label={labwareLabel}>
          <LabwareField {...propsForFields[addFieldNamePrefix('labware')]} />
        </FormGroup>
        <WellSelectionField
          {...propsForFields[addFieldNamePrefix('wells')]}
          labwareFieldName={addFieldNamePrefix('labware')}
          pipetteFieldName="pipette"
        />
      </div>
    </AspDispSection>
  )
}
