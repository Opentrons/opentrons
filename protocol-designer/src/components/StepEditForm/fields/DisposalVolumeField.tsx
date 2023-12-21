import * as React from 'react'
import {
  FormGroup,
  DeprecatedCheckboxField,
  DropdownField,
  Options,
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

interface DropdownFormFieldProps extends FieldProps {
  className?: string
  options: Options
}
const DropdownFormField = (props: DropdownFormFieldProps): JSX.Element => {
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

interface SP {
  disposalDestinationOptions: Options
  maxDisposalVolume?: number | null
}
interface OP {
  path: PathOption
  pipette: string | null
  propsForFields: FieldPropsByName
  stepType: StepType
  volume: string | null
  aspirate_airGap_checkbox?: boolean | null
  aspirate_airGap_volume?: string | null
  tipRack?: string | null
}
type Props = SP & OP

const DisposalVolumeFieldComponent = (props: Props): JSX.Element => {
  const { propsForFields } = props

  const { maxDisposalVolume } = props
  const volumeBoundsCaption =
    maxDisposalVolume != null
      ? `max ${maxDisposalVolume} ${i18n.t('application.units.microliter')}`
      : null

  const volumeField = (
    <div>
      <TextField
        {...propsForFields.disposalVolume_volume}
        caption={volumeBoundsCaption}
        className={cx(styles.small_field, styles.orphan_field)}
        units={i18n.t('application.units.microliter')}
      />
    </div>
  )

  const { value, updateValue } = propsForFields.disposalVolume_checkbox

  return (
    <FormGroup label={i18n.t('form.step_edit_form.multiDispenseOptionsLabel')}>
      <>
        <div
          // @ts-expect-error(sa, 2021-6-22): I think volumeBoundsCaption needs to be casted to a boolean to be fed into a class name
          className={cx(styles.checkbox_row, {
            [styles.captioned_field]: volumeBoundsCaption,
          })}
        >
          <DeprecatedCheckboxField
            label="Disposal Volume"
            value={Boolean(value)}
            className={cx(styles.checkbox_field, styles.large_field)}
            onChange={(e: React.ChangeEvent<any>) => updateValue(!value)}
          />
          {value ? volumeField : null}
        </div>
        {value ? (
          <div className={styles.checkbox_row}>
            <div className={styles.sub_label_no_checkbox}>Blowout</div>
            <DropdownFormField
              {...propsForFields.blowout_location}
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
    tipRack,
  } = ownProps

  const blowoutLocationOptions = getBlowoutLocationOptionsForForm({
    path,
    stepType,
  })

  const disposalOptions = uiLabwareSelectors.getDisposalOptions(state)

  const maxDisposalVolume = getMaxDisposalVolumeForMultidispense(
    {
      aspirate_airGap_checkbox,
      aspirate_airGap_volume,
      path,
      pipette,
      volume,
      tipRack
    },
    stepFormSelectors.getPipetteEntities(state),
    stepFormSelectors.getLabwareEntities(state)
  )

  return {
    maxDisposalVolume,
    disposalDestinationOptions: [...disposalOptions, ...blowoutLocationOptions],
  }
}

export const DisposalVolumeField = connect(mapSTP)(DisposalVolumeFieldComponent)
