import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { selectors as stepFormSelectors } from '../../../../../step-forms'
import SINGLE_IMAGE from '../../../../../assets/images/path_single_transfers.svg'
import MULTI_DISPENSE_IMAGE from '../../../../../assets/images/path_multi_dispense.svg'
import MULTI_ASPIRATE_IMAGE from '../../../../../assets/images/path_multi_aspirate.svg'
import { getDisabledPathMap } from './utils'
import type { PathOption } from '../../../../../form-types'
import type { FieldProps } from '../types'
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

interface PathButtonProps {
  disabled: boolean
  selected: boolean
  subtitle: string
  onClick: (e: React.ChangeEvent<HTMLInputElement>) => void
  path: PathOption
  id?: string
  children?: React.ReactNode
}

const PathButton = (props: PathButtonProps): JSX.Element => {
  const { disabled, onClick, id, path, selected, subtitle } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { t } = useTranslation(['form', 'protocol_steps'])
  // TODO: update the tooltip and images
  const tooltip = (
    <Tooltip tooltipProps={tooltipProps}>
      <div>{t(`step_edit_form.field.path.title.${path}`)}</div>
      <img src={PATH_ANIMATION_IMAGES[path]} />
      <div>{subtitle}</div>
    </Tooltip>
  )

  return (
    <Flex {...targetProps} width="100%" key={id}>
      {tooltip}
      <RadioButton
        width="100%"
        isSelected={selected}
        largeDesktopBorderRadius
        onChange={e => {
          onClick(e)
        }}
        disabled={disabled}
        buttonLabel={t(`protocol_steps:${path}`)}
        buttonValue={path}
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
      width="100%"
    >
      {ALL_PATH_OPTIONS.map(option => {
        const { name } = option
        return (
          <PathButton
            id={`PathButton_${name}`}
            key={name}
            selected={name === value}
            path={name}
            disabled={disabledPathMap !== null && name in disabledPathMap}
            subtitle={getSubtitle(name, disabledPathMap)}
            onClick={() => {
              updateValue(name)
            }}
          >
            <img />
          </PathButton>
        )
      })}
    </Flex>
  )
}
