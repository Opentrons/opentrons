// @flow
import * as React from 'react'
import cx from 'classnames'
import { FormGroup, Tooltip, useHoverTooltip } from '@opentrons/components'
import { i18n } from '../../../../localization'
import SINGLE_IMAGE from '../../../../images/path_single_transfers.svg'
import MULTI_DISPENSE_IMAGE from '../../../../images/path_multi_dispense.svg'
import MULTI_ASPIRATE_IMAGE from '../../../../images/path_multi_aspirate.svg'
import type { PathOption } from '../../../../form-types'
import type { FieldProps } from '../../types'
import type { DisabledPathMap, ValuesForPath } from './getDisabledPathMap'
import styles from '../../StepEditForm.css'

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

type PathFieldProps = {|
  ...FieldProps,
  ...ValuesForPath,
  disabledPathMap: DisabledPathMap,
|}

type ButtonProps = {
  children?: React.Node,
  disabled: boolean,
  id?: string,
  selected: boolean,
  subtitle: string,
  onClick: (e: SyntheticMouseEvent<*>) => mixed,
  path: PathOption,
}

const PathButton = (buttonProps: ButtonProps) => {
  const {
    children,
    disabled,
    onClick,
    id,
    path,
    selected,
    subtitle,
  } = buttonProps
  const [targetProps, tooltipProps] = useHoverTooltip()

  const tooltip = (
    <Tooltip {...tooltipProps}>
      <div className={styles.path_tooltip_title}>
        {i18n.t(`form.step_edit_form.field.path.title.${path}`)}
      </div>
      <img
        className={styles.path_tooltip_image}
        src={PATH_ANIMATION_IMAGES[path]}
      />
      <div className={styles.path_tooltip_subtitle}>{subtitle}</div>
    </Tooltip>
  )

  return (
    <>
      {tooltip}
      <li
        {...targetProps}
        className={cx(styles.path_option, {
          [styles.selected]: selected,
          [styles.disabled]: disabled,
        })}
        onClick={disabled ? null : onClick}
        id={id}
      >
        {children}
      </li>
    </>
  )
}

const getSubtitle = (
  path: PathOption,
  disabledPathMap: DisabledPathMap
): string => {
  const reasonForDisabled = disabledPathMap && disabledPathMap[path]
  return reasonForDisabled || ''
}

const getPathButtonId = (name, selectedValue) =>
  `PathButton_${name}_${name === selectedValue ? 'selected' : 'deselected'}`

export const Path = (props: PathFieldProps): React.Node => {
  const { disabledPathMap, value, updateValue } = props
  return (
    <FormGroup label="Path">
      <ul className={styles.path_options}>
        {ALL_PATH_OPTIONS.map(option => (
          <PathButton
            id={getPathButtonId(option.name, value)}
            key={option.name}
            selected={option.name === value}
            path={option.name}
            disabled={
              disabledPathMap !== null && option.name in disabledPathMap
            }
            subtitle={getSubtitle(option.name, disabledPathMap)}
            onClick={() => updateValue(option.name)}
          >
            <img src={option.image} className={styles.path_image} />
          </PathButton>
        ))}
      </ul>
    </FormGroup>
  )
}
