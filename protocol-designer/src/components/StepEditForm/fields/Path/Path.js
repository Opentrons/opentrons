// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup, HoverTooltip} from '@opentrons/components'
import i18n from '../../../../localization'
import StepField from '../FieldConnector'
import styles from '../../StepEditForm.css'
import type {FocusHandlers} from '../../types'
import type {PathOption} from '../../../../form-types'
import SINGLE_IMAGE from '../../../../images/path_single_transfers.svg'
import MULTI_DISPENSE_IMAGE from '../../../../images/path_multi_dispense.svg'
import MULTI_ASPIRATE_IMAGE from '../../../../images/path_multi_aspirate.svg'

const PATH_ANIMATION_IMAGES = {
  single: require('../../../../images/path_single.gif'),
  multiAspirate: require('../../../../images/path_multiAspirate.gif'),
  multiDispense: require('../../../../images/path_multiDispense.gif'),
}

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
  path: PathOption,
}

const PathButton = (buttonProps: ButtonProps) => {
  const {disabled, children, path, selected, onClick} = buttonProps

  const tooltip = (
    <div>
      <div className={styles.path_tooltip_title}>
        {i18n.t(`form.step_edit_form.field.path.title.${path}`)}
      </div>
      <img className={styles.path_tooltip_image} src={PATH_ANIMATION_IMAGES[path]} />
      <div className={styles.path_tooltip_subtitle}>{i18n.t(disabled
        ? `form.step_edit_form.field.path.not_compatible`
        : `form.step_edit_form.field.path.subtitle.${path}`)}
      </div>
    </div>
  )

  return (
    <HoverTooltip tooltipComponent={tooltip}>{
      (hoverTooltipHandlers) => (
        <li
          {...hoverTooltipHandlers}
          className={cx(styles.path_option, {
            [styles.selected]: selected,
            [styles.disabled]: disabled,
          })}
          onClick={disabled ? null : onClick}>
          {children}
        </li>
      )
    }</HoverTooltip>
  )
}

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
              path={option.name}
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
