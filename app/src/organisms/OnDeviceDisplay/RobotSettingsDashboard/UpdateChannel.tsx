import { StyledText } from '../../../atoms/text'
import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import {
  getUpdateChannel,
  getUpdateChannelOptions,
  updateConfigValue,
} from '../../../redux/config'
import type { Dispatch } from '../../../redux/types'
import {
  Flex,
  SPACING,
  Btn,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  Icon,
  TYPOGRAPHY,
  COLORS,
  BORDERS,
} from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

interface LabelProps {
  isSelected?: boolean
}

const SettingButton = styled.input`
  display: none;
`

const SettingButtonLabel = styled.label<LabelProps>`
  padding: ${SPACING.spacing24};
  border-radius: ${BORDERS.size_four};
  cursor: pointer;
  background: ${({ isSelected }) =>
    isSelected === true ? COLORS.blueEnabled : COLORS.mediumBlueEnabled};
  color: ${({ isSelected }) => isSelected === true && COLORS.white};
`

interface UpdateChannelProps {
  setCurrentOption: (currentOption: SettingOption | null) => void
  devToolsOn: boolean
}

export function UpdateChannel({
  setCurrentOption,
  devToolsOn,
}: UpdateChannelProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'app_settings'])
  const dispatch = useDispatch<Dispatch>()

  const channel = useSelector(getUpdateChannel)
  const channelOptions = useSelector(getUpdateChannelOptions)

  const modifiedChannelOptions = !Boolean(devToolsOn)
    ? channelOptions.filter(option => option.value !== 'alpha')
    : channelOptions

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    dispatch(updateConfigValue('update.channel', event.target.value))
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex alignItems={ALIGN_CENTER}>
        <Btn
          onClick={() => setCurrentOption(null)}
          data-testid="UpdateChannel_back_button"
        >
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t('app_settings:update_channel')}
        </StyledText>
      </Flex>
      <Flex marginTop={SPACING.spacing40}>
        <StyledText
          fontSize={TYPOGRAPHY.fontSize28}
          lineHeight={TYPOGRAPHY.lineHeight36}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
        >
          {t('update_channel_description')}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        marginTop={SPACING.spacing24}
      >
        {modifiedChannelOptions.map(radio => (
          <React.Fragment key={`channel_setting_${radio.label}`}>
            <SettingButton
              id={radio.label}
              type="radio"
              value={radio.value}
              checked={radio.value === channel}
              onChange={handleChange}
            />
            <SettingButtonLabel
              htmlFor={radio.label}
              isSelected={radio.value === channel}
            >
              <StyledText
                fontSize={TYPOGRAPHY.fontSize28}
                lineHeight="1.875rem"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
              >
                {radio.label}
              </StyledText>
              {radio.label === 'Alpha' ? (
                <StyledText
                  marginTop={SPACING.spacing4}
                  fontSize={TYPOGRAPHY.fontSize28}
                  lineHeight={TYPOGRAPHY.lineHeight36}
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={
                    radio.value === channel
                      ? COLORS.white
                      : COLORS.darkBlack_seventy
                  }
                >
                  {t('alpha_description')}
                </StyledText>
              ) : null}
            </SettingButtonLabel>
          </React.Fragment>
        ))}
      </Flex>
    </Flex>
  )
}
