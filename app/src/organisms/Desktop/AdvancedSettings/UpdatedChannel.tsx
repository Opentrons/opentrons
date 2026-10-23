import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  StyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SelectField } from '/app/atoms/SelectField'
import {
  getUpdateChannel,
  getUpdateChannelOptions,
  updateConfigValue,
} from '/app/redux/config'

import type { ComponentProps, ReactNode } from 'react'
import type { SelectOption } from '/app/atoms/SelectField/Select'
import type { Dispatch } from '/app/redux/types'

export function UpdatedChannel(): ReactNode {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const channel = useSelector(getUpdateChannel)
  const channelOptions: SelectOption[] = useSelector(getUpdateChannelOptions)
  const handleChannel = (_: string, value: string): void => {
    dispatch(updateConfigValue('update.channel', value))
  }

  const formatOptionLabel: ComponentProps<
    typeof SelectField
  >['formatOptionLabel'] = (option, index): JSX.Element => {
    const { label, value } = option
    return (
      <StyledText
        forwardedAs="p"
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {value === 'latest' ? label : value}
      </StyledText>
    )
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      gridGap={SPACING.spacing40}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText forwardedAs="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}
 paddingBottom={SPACING.spacing8}
 >
          {t('update_channel')}
        </StyledText>
        <StyledText forwardedAs="p" paddingBottom={SPACING.spacing8}>
          {t('update_description')}
        </StyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <StyledText forwardedAs="label" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('channel')}
        </StyledText>
        <SelectField
          name={'__UpdateChannel__'}
          options={channelOptions}
          onValueChange={handleChannel}
          value={channel}
          placeholder={channel}
          formatOptionLabel={formatOptionLabel}
          isSearchable={false}
          width="10rem"
        />
      </Flex>
    </Flex>
  )
}
