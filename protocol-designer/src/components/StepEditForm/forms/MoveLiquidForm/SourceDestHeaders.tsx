// @flow
import * as React from 'react'
import { FormGroup } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { LabwareField, WellSelectionField } from '../../fields'
import { AspDispSection } from '../AspDispSection'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FormData } from '../../../../form-types'
import type { FieldPropsByName } from '../../types'

import styles from '../../StepEditForm.css'

type Props = {|
  className?: ?string,
  collapsed?: ?boolean,
  formData: FormData,
  prefix: 'aspirate' | 'dispense',
  propsForFields: FieldPropsByName,
  toggleCollapsed: () => void,
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
    formData,
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
          labwareId={formData[addFieldNamePrefix('labware')]}
          pipetteId={formData['pipette']}
        />
      </div>
    </AspDispSection>
  )
}
