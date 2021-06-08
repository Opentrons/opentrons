// @flow
import * as React from 'react'
import {
  FormGroup,
  CheckboxField,
  DropdownField,
  type Options,
} from '@opentrons/components'
import { connect } from 'react-redux'
import cx from 'classnames'

import { i18n } from '../../../localization'
import { getMaxDisposalVolumeForMultidispense } from '../../../steplist/formLevel/handleFormChange/utils'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { getBlowoutLocationOptionsForForm } from '../utils'
import { TextField } from './TextField'

import { FieldProps, FieldPropsByName } from '../types'
import { PathOption, StepType } from '../../../form-types'
import { BaseState } from '../../../types'

import styles from '../StepEditForm.css'

type DropdownFormFieldProps = {
  ...FieldProps,
  className?: string,
  options: Options,
}
const DropdownFormField = (props: DropdownFormFieldProps) => {
  return (
    <DropdownField
      options={props.options}
      id={`DisposalVolumeField_dropdown`}
      value={props.value ? String(props.value) : null}
      onBlur={props.onFieldBlur}
      onChange={e => props.updateValue(e.currentTarget.value)}
      onFocus={props.onFieldFocus}
    />
  )
}

type SP = {
  disposalDestinationOptions: Options,
  maxDisposalVolume: ?number,
}
type OP = {
  aspirate_airGap_checkbox?: boolean | null,
  aspirate_airGap_volume?: string | null,
  path: PathOption,
  pipette: string | null,
  propsForFields: FieldPropsByName,
  stepType: StepType,
  volume: string | null,
}
type Props = SP & OP

const DisposalVolumeFieldComponent = (props: Props) => {
  const { propsForFields } = props

  const { maxDisposalVolume } = props
  const volumeBoundsCaption =
    maxDisposalVolume != null
      ? `max ${maxDisposalVolume} ${i18n.t('application.units.microliter')}`
      : null

  const volumeField = (
    <div>
      <TextField
        {...propsForFields['disposalVolume_volume']}
        caption={volumeBoundsCaption}
        className={cx(styles.small_field, styles.orphan_field)}
        units={i18n.t('application.units.microliter')}
      />
    </div>
  )

  const { value, updateValue } = propsForFields['disposalVolume_checkbox']

  return (
    <FormGroup label={i18n.t('form.step_edit_form.multiDispenseOptionsLabel')}>
      <>
        <div
          className={cx(styles.checkbox_row, {
            [styles.captioned_field]: volumeBoundsCaption,
          })}
        >
          <CheckboxField
            label="Disposal Volume"
            value={Boolean(value)}
            className={cx(styles.checkbox_field, styles.large_field)}
            onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)}
          />
          {value ? volumeField : null}
        </div>
        {value ? (
          <div className={styles.checkbox_row}>
            <div className={styles.sub_label_no_checkbox}>Blowout</div>
            <DropdownFormField
              {...propsForFields['blowout_location']}
              className={styles.large_field}
              options={props.disposalDestinationOptions}
            />
          </div>
        ) : null}
      </>
    </FormGroup>
  )
}
const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const {
    aspirate_airGap_checkbox,
    aspirate_airGap_volume,
    path,
    pipette,
    stepType,
    volume,
  } = ownProps

  const blowoutLocationOptions = getBlowoutLocationOptionsForForm({
    path,
    stepType,
  })

  const disposalLabwareOptions = uiLabwareSelectors.getDisposalLabwareOptions(
    state
  )

  const maxDisposalVolume = getMaxDisposalVolumeForMultidispense(
    {
      aspirate_airGap_checkbox,
      aspirate_airGap_volume,
      path,
      pipette,
      volume,
    },
    stepFormSelectors.getPipetteEntities(state)
  )

  return {
    maxDisposalVolume,
    disposalDestinationOptions: [
      ...disposalLabwareOptions,
      ...blowoutLocationOptions,
    ],
  }
}

export const DisposalVolumeField: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  _,
  _,
  _
>(mapSTP)(DisposalVolumeFieldComponent)
