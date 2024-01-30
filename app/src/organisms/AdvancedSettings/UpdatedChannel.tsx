import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SelectField } from '../../atoms/SelectField'
import {
  getUpdateChannel,
  getUpdateChannelOptions,
  updateConfigValue,
} from '../../redux/config'

import type { SelectOption } from '../../atoms/SelectField/Select'
import type { Dispatch } from '../../redux/types'

export function UpdatedChannel(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const channel = useSelector(getUpdateChannel)
  const channelOptions: SelectOption[] = useSelector(getUpdateChannelOptions)
  const handleChannel = (_: string, value: string): void => {
    dispatch(updateConfigValue('update.channel', value))
  }

  const formatOptionLabel: React.ComponentProps<
    typeof SelectField
  >['formatOptionLabel'] = (option, index): JSX.Element => {
    const { label, value } = option
    return (
      <StyledText
        as="p"
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        id={index}
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
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
          id="AdvancedSettings_updatedChannel"
        >
          {t('update_channel')}
        </StyledText>
        <StyledText as="p" paddingBottom={SPACING.spacing8}>
          {t('update_description')}
        </StyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <StyledText css={TYPOGRAPHY.labelSemiBold}>{t('channel')}</StyledText>
        <SelectField
          name={'__UpdateChannel__'}
          options={channelOptions}
          onValueChange={handleChannel}
          value={channel}
          placeholder={channel}
          formatOptionLabel={formatOptionLabel}
          isSearchable={false}
          width="10rem"
          data-testid="update-channel-selector"
        />
      </Flex>
    </Flex>
  )
}
