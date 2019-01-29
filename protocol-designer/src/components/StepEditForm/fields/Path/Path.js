// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup} from '@opentrons/components'
import StepField from '../FieldConnector'
import styles from '../../StepEditForm.css'
import type {FocusHandlers} from '../../types'
import type {PathOption} from '../../../../form-types'
import SINGLE_IMAGE from '../../../../images/path_single_transfers.svg'
import MULTI_DISPENSE_IMAGE from '../../../../images/path_multi_dispense.svg'
import MULTI_ASPIRATE_IMAGE from '../../../../images/path_multi_aspirate.svg'

const ALL_PATH_OPTIONS = [
  {
    name: 'single',
    image: SINGLE_IMAGE,
  },
  {
    name: 'multiAspirate',
    image: MULTI_ASPIRATE_IMAGE,
  },
  {
    name: 'multiDispense',
    image: MULTI_DISPENSE_IMAGE,
  },
]

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
              key={option.name}
              selected={option.name === value}
              disabled={props.disabledPaths && props.disabledPaths.has(option.name)}
              onClick={() => updateValue(option.name)}>
              <img src={option.image} className={styles.path_image} />
            </PathButton>
          ))}
        </ul>
      )} />
  </FormGroup>
)

export default PathField
