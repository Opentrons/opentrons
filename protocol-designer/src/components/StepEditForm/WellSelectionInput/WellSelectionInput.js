// @flow
import * as React from 'react'
import {FormGroup, InputField} from '@opentrons/components'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import styles from '../StepEditForm.css'

type Props = {
  name: StepFieldName,
  primaryWellCount?: number,
  disabled: boolean,
  onClick?: (e: SyntheticMouseEvent<*>) => mixed,
  errorToShow: ?string,
  isMulti: ?boolean,
}

export default function WellSelectionInput (props: Props) {
  return (
    <FormGroup
      label={props.isMulti ? 'Columns:' : 'Wells:'}
      disabled={props.disabled}
      className={styles.well_selection_input}
      >
        <InputField
          readOnly
          name={props.name}
          value={props.primaryWellCount ? String(props.primaryWellCount) : null}
          onClick={props.onClick}
          error={props.errorToShow} />
        </FormGroup>
  )
}
