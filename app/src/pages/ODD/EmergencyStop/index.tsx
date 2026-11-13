import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  StepMeter,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useEstopQuery } from '@opentrons/react-api-client'

import estopImg from '/app/assets/images/on-device-display/install_e_stop.png'
import { MediumButton } from '/app/components/ODD/buttons'

import type { ReactNode } from 'react'

const ESTOP_STATUS_REFETCH_INTERVAL_MS = 10000

export function EmergencyStop(): ReactNode {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const navigate = useNavigate()

  // Note here the touchscreen app is using status since status is linked to EstopPhysicalStatuses
  // left notPresent + right disengaged => disengaged
  // left notPresent + right notPresent => notPresent
  const { data: estopStatusData } = useEstopQuery({
    refetchInterval: ESTOP_STATUS_REFETCH_INTERVAL_MS,
  })

  const isEstopConnected = estopStatusData?.data?.status !== 'notPresent'

  return (
    <>
      <StepMeter totalSteps={6} currentStep={4} />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        paddingX={SPACING.spacing40}
      >
        <Flex
          paddingY={SPACING.spacing32}
          justifyContent={JUSTIFY_CENTER}
          alignItems={ALIGN_CENTER}
        >
          <StyledText forwardedAs="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('install_e_stop')}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
          backgroundColor={isEstopConnected ? COLORS.green35 : COLORS.grey35}
          borderRadius={BORDERS.borderRadius8}
          alignItems={ALIGN_CENTER}
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={isEstopConnected ? SPACING.spacing32 : SPACING.spacing16}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            height="13.5rem"
          >
            {isEstopConnected ? (
              <>
                <Icon
                  name="ot-check"
                  size="3rem"
                  color={COLORS.green50}
                  data-testid="EmergencyStop_connected_icon"
                />
                <StyledText
                  forwardedAs="h3"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  {t('e_stop_connected')}
                </StyledText>
              </>
            ) : (
              <>
                <img src={estopImg} height="116px" alt="E-stop button" />
                <StyledText
                  forwardedAs="h3"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  color={COLORS.grey60}
                  textAlign={TYPOGRAPHY.textAlignCenter}
                >
                  {t('e_stop_not_connected')}
                </StyledText>
              </>
            )}
          </Flex>
        </Flex>
        <MediumButton
          flex="1"
          buttonText={i18n.format(t('shared:continue'), 'capitalize')}
          disabled={!isEstopConnected}
          onClick={() => {
            navigate('/robot-settings/rename-robot')
          }}
        />
      </Flex>
    </>
  )
}
