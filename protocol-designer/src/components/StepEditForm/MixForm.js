// @flow
import * as React from 'react'
import cx from 'classnames'
import i18n from '../../localization'
import {FormGroup, HoverTooltip} from '@opentrons/components'

import {
  StepInputField,
  StepCheckboxRow,
  DispenseDelayFields,
  PipetteField,
  LabwareDropdown,
  ChangeTipField,
  FlowRateField,
  TipPositionField
} from './formFields'

import WellSelectionInput from './WellSelectionInput'
import type {FocusHandlers} from './index'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'

type MixFormProps = {focusHandlers: FocusHandlers}

const MixForm = (props: MixFormProps): React.Element<React.Fragment> => {
  const {focusHandlers} = props
  return (
    <React.Fragment>
      <div className={formStyles.row_wrapper}>
        <FormGroup label='Labware:' className={styles.labware_field}>
          <LabwareDropdown name="labware" {...focusHandlers} />
        </FormGroup>
        <WellSelectionInput name="wells" labwareFieldName="labware" pipetteFieldName="pipette" {...focusHandlers} />
        <PipetteField name="pipette" {...focusHandlers} />
      </div>

      <div className={cx(formStyles.row_wrapper)}>
        <FormGroup label='Repetitions' className={styles.field_row}>
          <StepInputField name="volume" units='μL' {...focusHandlers} />
          <StepInputField name="times" units='Times' {...focusHandlers} />
        </FormGroup>
      </div>

      <div className={formStyles.row_wrapper}>
        <div className={styles.left_settings_column}>
          <FormGroup label='TECHNIQUE'>
            <HoverTooltip tooltipComponent={i18n.t('tooltip.not_in_beta')}>
              {(hoverTooltipHandlers) => (
                <DispenseDelayFields
                  disabled
                  hoverTooltipHandlers={hoverTooltipHandlers}
                  focusHandlers={focusHandlers} />
              )}
            </HoverTooltip>
            <StepCheckboxRow name="dispense_blowout_checkbox" label='Blow out'>
              <LabwareDropdown name="dispense_blowout_labware" className={styles.full_width} {...focusHandlers} />
            </StepCheckboxRow>
            <StepCheckboxRow name="touchTip" label='Touch tip' />
          </FormGroup>
        </div>
        <div className={styles.right_settings_column}>
          <ChangeTipField name="aspirate_changeTip" />
          <FlowRateField />
          <TipPositionField />
        </div>
      </div>
    </React.Fragment>
  )
}

export default MixForm
