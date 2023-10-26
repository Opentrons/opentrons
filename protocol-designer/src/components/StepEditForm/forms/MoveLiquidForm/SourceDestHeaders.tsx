import * as React from 'react'
import { FormGroup } from '@opentrons/components'
import { i18n } from '../../../../localization'
import { StepFieldName } from '../../../../steplist/fieldLevel'
import { LabwareField, WellSelectionField } from '../../fields'
import { AspDispSection } from '../AspDispSection'
import type { FormData } from '../../../../form-types'
import type { FieldPropsByName } from '../../types'

import styles from '../../StepEditForm.css'

interface Props {
  className?: string | null
  collapsed?: boolean | null
  formData: FormData
  prefix: 'aspirate' | 'dispense'
  propsForFields: FieldPropsByName
  toggleCollapsed: () => void
}

const makeAddFieldNamePrefix = (prefix: string) => (
  fieldName: string
): StepFieldName => `${prefix}_${fieldName}`

export const SourceDestHeaders = (props: Props): JSX.Element => {
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
  const wasteChuteOrLabwareId = formData[addFieldNamePrefix('labware')]

  return (
    <AspDispSection {...{ className, collapsed, toggleCollapsed, prefix }}>
      <div className={styles.form_row}>
        <FormGroup label={labwareLabel}>
          <LabwareField {...propsForFields[addFieldNamePrefix('labware')]} />
        </FormGroup>
        {wasteChuteOrLabwareId?.includes('wasteChute') ? null : (
          <WellSelectionField
            {...propsForFields[addFieldNamePrefix('wells')]}
            labwareId={wasteChuteOrLabwareId}
            pipetteId={formData.pipette}
          />
        )}
      </div>
    </AspDispSection>
  )
}
