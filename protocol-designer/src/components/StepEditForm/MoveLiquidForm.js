// @flow
import * as React from 'react'
import cx from 'classnames'

import {
  VolumeField,
  PipetteField,
  ChangeTipField,
  DisposalVolumeField,
  PathField,
} from './fields'
import SourceDestFields from './fields/SourceDestFields'
import styles from './StepEditForm.css'
import type {FocusHandlers} from './index'
import type {StepType, HydratedMoveLiquidFormDataLegacy} from '../../form-types'

type MoveLiquidFormProps = {
  focusHandlers: FocusHandlers,
  stepType: StepType,
  formData: HydratedMoveLiquidFormDataLegacy,
}

// TODO: BC: IMMEDIATELY field label font weight from 800 to 600
// TODO: BC: IMMEDIATELY flowrate Type is hardcoded in SourceDestFields
// TODO: BC: IMMEDIATELY i18n all across SourceDestFields
// TODO: BC: IMMEDIATELY instead of passing path from here, put it in connect fields where needed

const MoveLiquidForm = (props: MoveLiquidFormProps) => {
  const {focusHandlers, stepType} = props
  const {path} = props.formData
  return (
    <React.Fragment>
      <div className={cx(styles.field_row, styles.start_group)}>
        <PipetteField name="pipette" stepType={stepType} {...focusHandlers} />
        <VolumeField focusHandlers={focusHandlers} stepType={stepType} />
      </div>
      <div className={styles.section_divider}></div>

      <SourceDestFields focusHandlers={focusHandlers} prefix="aspirate" />
      <div className={styles.section_divider}></div>

      <SourceDestFields focusHandlers={focusHandlers} prefix="dispense" />
      <div className={styles.section_divider}></div>

      <div className={styles.field_row}>
        <div className={styles.start_group}>
          <ChangeTipField stepType={stepType} name="changeTip" />
          <PathField focusHandlers={focusHandlers} />
        </div>
        <div className={styles.end_group}>
          {path === 'multiDispense' && <DisposalVolumeField focusHandlers={focusHandlers} />}
        </div>
      </div>
    </React.Fragment>
  )
}

export default MoveLiquidForm
