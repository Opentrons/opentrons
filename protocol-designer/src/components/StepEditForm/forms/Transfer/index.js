// @flow
import * as React from 'react'
import cx from 'classnames'

import type {StepType, HydratedMoveLiquidFormDataLegacy} from '../../../../form-types'
import {
  VolumeField,
  PipetteField,
  ChangeTipField,
  DisposalVolumeField,
  PathField,
} from '../../fields'
import styles from '../../StepEditForm.css'
import type {FocusHandlers} from '../../types'
import SourceDestFields from './SourceDestFields'

type TransferFormProps = {
  focusHandlers: FocusHandlers,
  stepType: StepType,
  formData: HydratedMoveLiquidFormDataLegacy,
}

// TODO: BC: IMMEDIATELY field label font weight from 800 to 600
// TODO: BC: IMMEDIATELY flowrate Type is hardcoded in SourceDestFields
// TODO: BC: IMMEDIATELY i18n all across SourceDestFields
// TODO: BC: IMMEDIATELY instead of passing path from here, put it in connect fields where needed

const TransferForm = (props: TransferFormProps) => {
  const {focusHandlers, stepType} = props
  const {path} = props.formData
  return (
    <React.Fragment>
      <div className={cx(styles.form_row, styles.start_group)}>
        <PipetteField name="pipette" stepType={stepType} {...focusHandlers} />
        <VolumeField label="Transfer Vol:" focusHandlers={focusHandlers} stepType={stepType} />
      </div>
      <div className={styles.section_divider}></div>

      <SourceDestFields focusHandlers={focusHandlers} prefix="aspirate" />
      <div className={styles.section_divider}></div>

      <SourceDestFields focusHandlers={focusHandlers} prefix="dispense" />
      <div className={styles.section_divider}></div>

      <div className={styles.form_row}>
        <div className={styles.start_group}>
          <ChangeTipField stepType={stepType} name="changeTip" />
          <PathField focusHandlers={focusHandlers} />
        </div>
        <div className={cx(styles.end_group, styles.disposal_vol_wrapper)}>
          {path === 'multiDispense' && <DisposalVolumeField focusHandlers={focusHandlers} />}
        </div>
        <div className={styles.hidden_fields}></div>
      </div>
    </React.Fragment>
  )
}

export default TransferForm
