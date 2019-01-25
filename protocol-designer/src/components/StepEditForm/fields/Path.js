// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup} from '@opentrons/components'
import styles from '../StepEditForm.css'
import type {FocusHandlers} from '../index'
import StepField from './StepFormField'

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
            Single
          </li>
          <li
            className={cx(styles.path_option, {[styles.selected]: value === 'multiDispense'})}
            onClick={(e: SyntheticMouseEvent<*>) => updateValue('multiDispense')}>
            Multi-Dispense
          </li>
          <li
            className={cx(styles.path_option, {[styles.selected]: value === 'multiAspirate'})}
            onClick={(e: SyntheticMouseEvent<*>) => updateValue('multiAspirate')}>
            Multi-Aspirate
          </li>
        </ul>
      )} />
  </FormGroup>
)

export default PathField
