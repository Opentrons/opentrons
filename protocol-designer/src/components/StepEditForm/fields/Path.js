// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup} from '@opentrons/components'
import styles from '../StepEditForm.css'
import type {FocusHandlers} from '../index'
import StepField from './FieldConnector'

import SINGLE_IMAGE from '../../../images/path_single_transfers.svg'
import MULTI_DISPENSE_IMAGE from '../../../images/path_multi_dispense.svg'
import MULTI_ASPIRATE_IMAGE from '../../../images/path_multi_aspirate.svg'

type PathFieldProps = {focusHandlers: FocusHandlers}
const PathField = (props: PathFieldProps) => (
  <FormGroup label='Path:'>
    <StepField
      name="path"
      render={({value, updateValue}) => (
        <ul className={styles.path_options}>
          <li
            className={cx(styles.path_option, {[styles.selected]: value === 'single'})}
            onClick={(e: SyntheticMouseEvent<*>) => updateValue('single')}>
            <img src={SINGLE_IMAGE} className={styles.path_image} />
          </li>
          <li
            className={cx(styles.path_option, {[styles.selected]: value === 'multiDispense'})}
            onClick={(e: SyntheticMouseEvent<*>) => updateValue('multiDispense')}>
            <img src={MULTI_DISPENSE_IMAGE} className={styles.path_image} />
          </li>
          <li
            className={cx(styles.path_option, {[styles.selected]: value === 'multiAspirate'})}
            onClick={(e: SyntheticMouseEvent<*>) => updateValue('multiAspirate')}>
            <img src={MULTI_ASPIRATE_IMAGE} className={styles.path_image} />
          </li>
        </ul>
      )} />
  </FormGroup>
)

export default PathField
