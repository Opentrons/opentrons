import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Icon,
  Flex,
  SPACING,
  COLORS,
  BORDERS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useEstopQuery } from '@opentrons/react-api-client'

import { StyledText } from '../../atoms/text'
import { MediumButton } from '../../atoms/buttons'
import { StepMeter } from '../../atoms/StepMeter'

import estopImg from '../../assets/images/on-device-display/install_e_stop.png'

const ESTOP_STATUS_REFETCH_INTERVAL_MS = 10000

export function EmergencyStop(): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()

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
          <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('install_e_stop')}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing40} ${SPACING.spacing80}`}
          backgroundColor={
            isEstopConnected ? COLORS.green3 : COLORS.darkBlack20
          }
          borderRadius={BORDERS.borderRadiusSize3}
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
                  color={COLORS.green2}
                  data-testid="EmergencyStop_connected_icon"
                />
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {t('e_stop_connected')}
                </StyledText>
              </>
            ) : (
              <>
                <img src={estopImg} height="116px" alt="E-stop button" />
                <StyledText
                  as="h3"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  color={COLORS.darkBlack70}
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
          onClick={() => history.push('/robot-settings/rename-robot')}
        />
      </Flex>
    </>
  )
}
