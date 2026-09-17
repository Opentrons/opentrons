import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_CENTER,
  LegacyStyledText,
  RadioButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { useIsUnboxingFlowOngoing } from '/app/redux-resources/config'
import { getLocalRobot } from '/app/redux/discovery'
import { useNetworkInterfaces } from '/app/resources/networking/hooks'

import { AlternativeSecurityTypeModal } from './AlternativeSecurityTypeModal'

import type { ChangeEvent, ReactNode } from 'react'
import type { WifiSecurityType } from '@opentrons/api-client'

interface SelectAuthenticationTypeProps {
  selectedAuthType: WifiSecurityType
  setSelectedAuthType: (authType: WifiSecurityType) => void
}

export function SelectAuthenticationType({
  selectedAuthType,
  setSelectedAuthType,
}: SelectAuthenticationTypeProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'shared'])
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const isUnboxingFlowOngoing = useIsUnboxingFlowOngoing()
  const { wifi } = useNetworkInterfaces(robotName)
  const [
    showAlternativeSecurityTypeModal,
    setShowAlternativeSecurityTypeModal,
  ] = useState<boolean>(false)

  const securityButtons = [
    {
      label: t('wpa2_personal'),
      subLabel: t('wpa2_personal_description'),
      value: 'wpa-psk',
    },
    {
      label: t('shared:none'),
      subLabel: t('none_description'),
      value: 'none',
    },
  ]

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSelectedAuthType(event.target.value as WifiSecurityType)
  }

  return (
    <>
      {showAlternativeSecurityTypeModal ? (
        <AlternativeSecurityTypeModal
          setShowAlternativeSecurityTypeModal={
            setShowAlternativeSecurityTypeModal
          }
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_COLUMN}
          marginTop={isUnboxingFlowOngoing ? undefined : '7.75rem'}
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            width="100%"
          >
            {securityButtons.map(radio => (
              <RadioButton
                key={radio.label}
                buttonLabel={radio.label}
                buttonValue={radio.value}
                onChange={handleChange}
                isSelected={radio.value === selectedAuthType}
                buttonSubLabel={{
                  label: radio.subLabel ?? undefined,
                  align: 'vertical',
                }}
              />
            ))}
          </Flex>
          <Flex marginY={SPACING.spacing24}>
            <LegacyStyledText
              forwardedAs="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              color={COLORS.grey60}
            >
              {t('your_mac_address_is', { macAddress: wifi?.macAddress })}
            </LegacyStyledText>
          </Flex>
          <Btn
            display={DISPLAY_FLEX}
            width="100%"
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            onClick={() => {
              setShowAlternativeSecurityTypeModal(true)
            }}
            padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
          >
            <LegacyStyledText
              forwardedAs="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.grey60}
            >
              {t('need_another_security_type')}
            </LegacyStyledText>
          </Btn>
        </Flex>
      </Flex>
    </>
  )
}
