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
import { useConnectionsQuery } from '@opentrons/react-api-client'
import { StyledText } from '../../atoms/text'
import { StepMeter } from '../../atoms/StepMeter'
import { MediumButton } from '../../atoms/buttons'

export function ConnectViaUSB(): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  // TODO(bh, 2023-5-31): active connections from /system/connected isn't exactly the right way to monitor for a usb connection -
  // the system-server tracks active connections by authorization token, which is valid for 2 hours
  // another option is to report an active usb connection by monitoring usb port traffic (discovery-client polls health from the desktop app)
  const activeConnections = useConnectionsQuery().data?.connections ?? []
  const isConnected = activeConnections.some(
    connection => connection.agent === 'com.opentrons.app.usb'
  )

  return (
    <>
      <StepMeter totalSteps={6} currentStep={2} />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_CENTER}
          marginBottom={SPACING.spacing32}
          position={POSITION_RELATIVE}
        >
          <Btn
            left="0"
            onClick={() => history.push('/network-setup')}
            position={POSITION_ABSOLUTE}
          >
            <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
              <Icon
                aria-label="Connect_via_usb_back_button"
                name="back"
                size="3rem"
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
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.green3}
              borderRadius={BORDERS.borderRadiusSize3}
              height="18.5rem"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing32}
              justifyContent={JUSTIFY_CENTER}
              padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
            >
              <Icon name="ot-check" size="3rem" color={COLORS.green2} />
              <Flex
                alignItems={ALIGN_CENTER}
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
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
              onClick={() => history.push('/emergency-stop')}
            />
          </Flex>
        ) : (
          <Flex
            alignItems={ALIGN_CENTER}
            backgroundColor={COLORS.darkBlack20}
            borderRadius={BORDERS.borderRadiusSize3}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing32}
            height="25.25rem"
            justifyContent={JUSTIFY_CENTER}
            padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
          >
            <Icon name="ot-alert" size="3rem" />
            <Flex
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing4}
              justifyContent={JUSTIFY_CENTER}
            >
              <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                {t('no_connection_found')}
              </StyledText>
              <Flex
                alignItems={ALIGN_CENTER}
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing8}
              >
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
