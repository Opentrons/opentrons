// @flow
import * as React from 'react'
import {FormGroup, CheckboxField, type DropdownOption, DropdownField} from '@opentrons/components'
import {connect} from 'react-redux'
import cx from 'classnames'

import {getMaxDisposalVolumeForMultidispense} from '../../../steplist/formLevel/handleFormChange/utils'
import {SOURCE_WELL_BLOWOUT_DESTINATION} from '../../../step-generation/utils'
import {selectors as stepFormSelectors} from '../../../step-forms'

import FieldConnector from './FieldConnector'
import TextField from './Text'

import type {BaseState} from '../../../types'
import type {FocusHandlers} from '../types'
import styles from '../StepEditForm.css'

type SP = {
  disposalDestinationOptions: Array<DropdownOption>,
  maxDisposalVolume: ?number,
}

type Props = SP & {focusHandlers: FocusHandlers}

const DisposalVolumeField = (props: Props) => (
  <FormGroup label='Multi-Dispense Options:'>
    <FieldConnector
      name="disposalVolume_checkbox"
      render={({value, updateValue}) => {
        const {maxDisposalVolume} = props
        const volumeBoundsCaption = maxDisposalVolume != null
          ? `max ${maxDisposalVolume} μL`
          : null

        const volumeField = (
          <div>
            <TextField
              name="disposalVolume_volume"
              units="μL"
              caption={volumeBoundsCaption}
              className={cx(styles.small_field, styles.orphan_field)}
              {...props.focusHandlers} />
          </div>
        )

        return (
          <React.Fragment>
            <div className={cx(
              styles.checkbox_row,
              styles.multi_dispense_options,
              {[styles.captioned_field]: volumeBoundsCaption}
            )}>
              <CheckboxField
                label="Disposal Volume"
                value={Boolean(value)}
                className={styles.checkbox_field}
                onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)} />
              {
                value
                  ? volumeField
                  : null
              }
            </div>
            {
              value
                ? (
                  <div className={styles.checkbox_row}>
                    <div className={styles.sub_select_label}>Blowout</div>
                    <FieldConnector
                      name="blowout_location"
                      focusedField={props.focusHandlers.focusedField}
                      dirtyFields={props.focusHandlers.dirtyFields}
                      render={({value, updateValue}) => (
                        <DropdownField
                          className={cx(styles.medium_field, styles.orphan_field)}
                          options={props.disposalDestinationOptions}
                          onBlur={() => { props.focusHandlers.onFieldBlur('blowout_location') }}
                          onFocus={() => { props.focusHandlers.onFieldFocus('blowout_location') }}
                          value={value ? String(value) : null}
                          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
                      )} />
                  </div>
                )
                : null
            }
          </React.Fragment>
        )
      }} />
  </FormGroup>
)

const mapSTP = (state: BaseState): SP => {
  return {
    maxDisposalVolume: getMaxDisposalVolumeForMultidispense(stepFormSelectors.getUnsavedForm(state), stepFormSelectors.getPipetteEntities(state)),
    disposalDestinationOptions: [
      ...stepFormSelectors.getDisposalLabwareOptions(state),
      {name: 'Source Well', value: SOURCE_WELL_BLOWOUT_DESTINATION},
    ],
  }
}

export default connect(mapSTP)(DisposalVolumeField)
