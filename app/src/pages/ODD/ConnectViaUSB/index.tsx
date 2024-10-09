import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useConnectionsQuery } from '@opentrons/react-api-client'
import { StepMeter } from '/app/atoms/StepMeter'
import { MediumButton } from '/app/atoms/buttons'

export function ConnectViaUSB(): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared', 'branded'])
  const navigate = useNavigate()
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
            onClick={() => {
              navigate('/network-setup')
            }}
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
            <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
              {t('usb')}
            </LegacyStyledText>
          </Flex>
        </Flex>
        {isConnected ? (
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
            <Flex
              alignItems={ALIGN_CENTER}
              backgroundColor={COLORS.green35}
              borderRadius={BORDERS.borderRadius12}
              height="18.5rem"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing32}
              justifyContent={JUSTIFY_CENTER}
              padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
            >
              <Icon name="ot-check" size="3rem" color={COLORS.green50} />
              <Flex
                alignItems={ALIGN_CENTER}
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
              >
                <LegacyStyledText
                  as="h3"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {t('successfully_connected')}
                </LegacyStyledText>
                <LegacyStyledText
                  as="h4"
                  color={COLORS.grey60}
                  textAlign={TYPOGRAPHY.textAlignCenter}
                >
                  {t('branded:find_your_robot')}
                </LegacyStyledText>
              </Flex>
            </Flex>
            <MediumButton
              buttonText={i18n.format(t('shared:continue'), 'capitalize')}
              onClick={() => {
                navigate('/emergency-stop')
              }}
            />
          </Flex>
        ) : (
          <Flex
            alignItems={ALIGN_CENTER}
            backgroundColor={COLORS.grey35}
            borderRadius={BORDERS.borderRadius12}
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
              <LegacyStyledText
                as="h3"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              >
                {t('no_connection_found')}
              </LegacyStyledText>
              <Flex
                alignItems={ALIGN_CENTER}
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing8}
              >
                <LegacyStyledText as="h4" color={COLORS.grey60}>
                  {t('connect_via_usb_description_1')}
                </LegacyStyledText>
                <LegacyStyledText as="h4" color={COLORS.grey60}>
                  {t('connect_via_usb_description_2')}
                </LegacyStyledText>
                <LegacyStyledText as="h4" color={COLORS.grey60}>
                  {t('branded:connect_via_usb_description_3')}
                </LegacyStyledText>
              </Flex>
            </Flex>
          </Flex>
        )}
      </Flex>
    </>
  )
}
