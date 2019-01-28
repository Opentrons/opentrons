// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup} from '@opentrons/components'
import StepField from '../FieldConnector'
import styles from '../../StepEditForm.css'
import type {FocusHandlers} from '../../index'
import type {PathOption} from '../../../../form-types'

const ALL_PATH_OPTIONS = ['single', 'multiAspirate', 'multiDispense']

type PathFieldProps = {
  focusHandlers: FocusHandlers,
  disabledPaths: ?Set<PathOption>,
}

type ButtonProps = {
  children?: React.Node,
  disabled?: ?boolean,
  selected?: boolean,
  onClick?: (e: SyntheticMouseEvent<*>) => mixed,
}

const PathButton = (buttonProps: ButtonProps) => (
  <li
    className={cx(styles.path_option, {
      [styles.selected]: buttonProps.selected,
      [styles.disabled]: buttonProps.disabled,
    })}
    onClick={buttonProps.disabled ? null : buttonProps.onClick}>
    {buttonProps.children}
  </li>
)

const PathField = (props: PathFieldProps) => (
  <FormGroup label='Path:'>
    <StepField
      name="path"
      render={({value, updateValue}) => (
        <ul className={styles.path_options}>
          {ALL_PATH_OPTIONS.map(option => (
            <PathButton
              key={option}
              selected={option === value}
              disabled={props.disabledPaths && props.disabledPaths.has(option)}
              onClick={() => updateValue(option)}
              // TODO Ian 2019-01-28: use icon instead of passing in `{option}` as text
            >{option}</PathButton>
          ))}
        </ul>
      )} />
  </FormGroup>
)

export default PathField
