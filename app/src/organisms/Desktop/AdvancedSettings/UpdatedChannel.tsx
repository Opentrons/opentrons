import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SelectField } from '/app/atoms/SelectField'
import {
  getUpdateChannel,
  getUpdateChannelOptions,
  updateConfigValue,
} from '/app/redux/config'
import { useHandleAndLog } from '/app/resources/access-control/useHandleAndLog'

import type { ComponentProps } from 'react'
import type { SelectOption } from '/app/atoms/SelectField/Select'
import type { Dispatch } from '/app/redux/types'

export function UpdatedChannel(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const channel = useSelector(getUpdateChannel)
  const channelOptions: SelectOption[] = useSelector(getUpdateChannelOptions)
  const handleChannelAndLog = useHandleAndLog<string>(
    (value: string) => {
      dispatch(updateConfigValue('update.channel', value))
    },
    'change_update_channel',
    (value: string) => ({
      action: 'change update channel',
      message: `User changed update channel to ${value}`,
    })
  )
  const handleChannel = (_: string, value: string): void => {
    handleChannelAndLog(value)
  }

  const formatOptionLabel: ComponentProps<
    typeof SelectField
  >['formatOptionLabel'] = (option, index): JSX.Element => {
    const { label, value } = option
    return (
      <LegacyStyledText
        forwardedAs="p"
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {value === 'latest' ? label : value}
      </LegacyStyledText>
    )
  }

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      gridGap={SPACING.spacing40}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
        >
          {t('update_channel')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p" paddingBottom={SPACING.spacing8}>
          {t('update_description')}
        </LegacyStyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <LegacyStyledText css={TYPOGRAPHY.labelSemiBold}>
          {t('channel')}
        </LegacyStyledText>
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
