import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
import {
  DIRECTION_COLUMN,
  Flex,
  FormGroup,
  LegacyTooltip,
  RadioButton,
  SPACING,
  useHoverTooltip,
} from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../../../../step-forms'
import SINGLE_IMAGE from '../../../../../assets/images/path_single_transfers.svg'
import MULTI_DISPENSE_IMAGE from '../../../../../assets/images/path_multi_dispense.svg'
import MULTI_ASPIRATE_IMAGE from '../../../../../assets/images/path_multi_aspirate.svg'
import type { PathOption } from '../../../../../form-types'
import type { FieldProps } from '../types'
import { getDisabledPathMap } from './utils'

import type { DisabledPathMap, ValuesForPath } from './utils'

const PATH_ANIMATION_IMAGES = {
  single: new URL(
    '../../../../../assets/images/path_single.gif',
    import.meta.url
  ).href,
  multiAspirate: new URL(
    '../../../../../assets/images/path_multiAspirate.gif',
    import.meta.url
  ).href,
  multiDispense: new URL(
    '../../../../../assets/images/path_multiDispense.gif',
    import.meta.url
  ).href,
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

type PathFieldProps = FieldProps & ValuesForPath

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
  const { t } = useTranslation('form')
  const tooltip = (
    <LegacyTooltip {...tooltipProps}>
      <div>{t(`step_edit_form.field.path.title.${path}`)}</div>
      <img src={PATH_ANIMATION_IMAGES[path]} />
      <div>{subtitle}</div>
    </LegacyTooltip>
  )

  const pathButtonData = `PathButton_${selected ? 'selected' : 'deselected'}_${
    disabled ? 'disabled' : 'enabled'
  }`

  return (
    <Flex {...targetProps} width="100%">
      {tooltip}
      <RadioButton
        largeDesktopBorderRadius
        onChange={disabled ? null : onClick}
        disabled={disabled}
        buttonLabel={path}
        buttonValue={path}
        // id={id}
        // data-test={pathButtonData}
      />
    </Flex>
  )
}

const getSubtitle = (
  path: PathOption,
  disabledPathMap: DisabledPathMap
): string => {
  const reasonForDisabled = disabledPathMap && disabledPathMap[path]
  return reasonForDisabled || ''
}

export const PathField = (props: PathFieldProps): JSX.Element => {
  const {
    aspirate_airGap_checkbox,
    aspirate_airGap_volume,
    aspirate_wells,
    changeTip,
    dispense_wells,
    pipette,
    volume,
    value,
    updateValue,
    tipRack,
  } = props
  const { t } = useTranslation('form')
  const pipetteEntities = useSelector(stepFormSelectors.getPipetteEntities)
  const disabledPathMap = getDisabledPathMap(
    {
      aspirate_airGap_checkbox,
      aspirate_airGap_volume,
      aspirate_wells,
      changeTip,
      dispense_wells,
      pipette,
      volume,
      tipRack,
    },
    pipetteEntities,
    t
  )
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing16}
    >
      {ALL_PATH_OPTIONS.map(option => (
        <PathButton
          id={`PathButton_${option.name}`}
          key={option.name}
          selected={option.name === value}
          path={option.name}
          disabled={disabledPathMap !== null && option.name in disabledPathMap}
          subtitle={getSubtitle(option.name, disabledPathMap)}
          onClick={() => {
            updateValue(option.name)
          }}
        >
          <img />
        </PathButton>
      ))}
    </Flex>
  )
}
