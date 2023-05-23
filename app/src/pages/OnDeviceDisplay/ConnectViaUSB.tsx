import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import {
  Flex,
  SPACING,
  COLORS,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  Btn,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  Icon,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
  BORDERS,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { StepMeter } from '../../atoms/StepMeter'
import { MediumButton } from '../../atoms/buttons'

export function ConnectViaUSB(): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  // ToDo (kj:05/16/2023) isConnected part will be implemented later
  const isConnected = false

  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} />
      <Flex
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
        flexDirection={DIRECTION_COLUMN}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          position={POSITION_RELATIVE}
          marginBottom={SPACING.spacing40}
        >
          <Btn
            position={POSITION_ABSOLUTE}
            left="0"
            onClick={() => history.push('/network-setup')}
          >
            <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
              <Icon
                name="back"
                size="3rem"
                aria-label="Connect_via_usb_back_button"
              />
            </Flex>
          </Btn>
          <Flex>
            <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
              {t('usb')}
            </StyledText>
          </Flex>
        </Flex>
        {isConnected ? (
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              backgroundColor={COLORS.green3}
              borderRadius={BORDERS.size3}
              height="18.5rem"
              alignItems={ALIGN_CENTER}
              justifyContent={JUSTIFY_CENTER}
              gridGap={SPACING.spacing32}
            >
              <Icon name="ot-check" size="3rem" color={COLORS.green2} />
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
                alignItems={ALIGN_CENTER}
              >
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {t('successfully_connected')}
                </StyledText>
                <StyledText
                  as="h4"
                  color={COLORS.darkBlack70}
                  textAlign={TYPOGRAPHY.textAlignCenter}
                >
                  {t('find_your_robot')}
                </StyledText>
              </Flex>
            </Flex>
            <MediumButton
              buttonText={i18n.format(t('shared:continue'), 'capitalize')}
              onClick={() => history.push('/robot-settings/update-robot')}
            />
          </Flex>
        ) : (
          <Flex
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
            backgroundColor={COLORS.darkBlack20}
            flexDirection={DIRECTION_COLUMN}
            padding={`${SPACING.spacing48} ${SPACING.spacing80}`}
            gridGap={SPACING.spacing32}
            height="25.25rem"
            borderRadius={BORDERS.size3}
          >
            <Icon name="ot-alert" size="3rem" />
            <Flex
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing4}
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
            >
              <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {t('no_connection_found')}
              </StyledText>
              <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
                <StyledText as="h4" color={COLORS.darkBlack70}>
                  {t('connect_via_usb_description_1')}
                </StyledText>
                <StyledText as="h4" color={COLORS.darkBlack70}>
                  {t('connect_via_usb_description_2')}
                </StyledText>
                <StyledText as="h4" color={COLORS.darkBlack70}>
                  {t('connect_via_usb_description_3')}
                </StyledText>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Flex>
    </>
  )
}
