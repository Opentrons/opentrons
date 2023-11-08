import * as React from 'react'
import cx from 'classnames'
import { FormGroup, Tooltip, useHoverTooltip } from '@opentrons/components'
import { i18n } from '../../../../localization'
import SINGLE_IMAGE from '../../../../images/path_single_transfers.svg'
import MULTI_DISPENSE_IMAGE from '../../../../images/path_multi_dispense.svg'
import MULTI_ASPIRATE_IMAGE from '../../../../images/path_multi_aspirate.svg'
import { PathOption } from '../../../../form-types'
import { FieldProps } from '../../types'
import { DisabledPathMap, ValuesForPath } from './getDisabledPathMap'
import styles from '../../StepEditForm.css'

const PATH_ANIMATION_IMAGES = {
  single: require('../../../../images/path_single.gif'),
  multiAspirate: require('../../../../images/path_multiAspirate.gif'),
  multiDispense: require('../../../../images/path_multiDispense.gif'),
}

const ALL_PATH_OPTIONS: Array<{ name: PathOption; image: string }> = [
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

type PathFieldProps = FieldProps &
  ValuesForPath & {
    disabledPathMap: DisabledPathMap
  }

interface ButtonProps {
  children?: React.ReactNode
  disabled: boolean
  id?: string
  selected: boolean
  subtitle: string
  onClick: (e: React.MouseEvent) => unknown
  path: PathOption
}

const PathButton = (buttonProps: ButtonProps): JSX.Element => {
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

  const pathButtonData = `PathButton_${selected ? 'selected' : 'deselected'}_${
    disabled ? 'disabled' : 'enabled'
  }`

  return (
    <>
      {tooltip}
      <li
        {...targetProps}
        className={cx(styles.path_option, {
          [styles.selected]: selected,
          [styles.disabled]: disabled,
        })}
        onClick={disabled ? undefined : onClick}
        id={id}
        data-test={pathButtonData}
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

export const Path = (props: PathFieldProps): JSX.Element => {
  const { disabledPathMap, value, updateValue } = props
  return (
    <FormGroup label="Path">
      <ul className={styles.path_options}>
        {ALL_PATH_OPTIONS.map(option => (
          <PathButton
            id={`PathButton_${option.name}`}
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
