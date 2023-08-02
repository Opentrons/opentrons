import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  Btn,
  JUSTIFY_CENTER,
  TYPOGRAPHY,
  DISPLAY_FLEX,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { RadioButton } from '../../atoms/buttons'
import { getLocalRobot } from '../../redux/discovery'
import { getNetworkInterfaces, fetchStatus } from '../../redux/networking'
import { AlternativeSecurityTypeModal } from './AlternativeSecurityTypeModal'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { Dispatch, State } from '../../redux/types'

interface SelectAuthenticationTypeProps {
  selectedAuthType: WifiSecurityType
  setSelectedAuthType: (authType: WifiSecurityType) => void
}

export function SelectAuthenticationType({
  selectedAuthType,
  setSelectedAuthType,
}: SelectAuthenticationTypeProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const [
    showAlternativeSecurityTypeModal,
    setShowAlternativeSecurityTypeModal,
  ] = React.useState<boolean>(false)

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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedAuthType(event.target.value as WifiSecurityType)
  }

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
  }, [robotName, dispatch])

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
        <Flex alignItems={ALIGN_CENTER} flexDirection={DIRECTION_COLUMN}>
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
                subButtonLabel={radio.subLabel ?? undefined}
                isSelected={radio.value === selectedAuthType}
              />
            ))}
          </Flex>
          <Flex marginTop="1.75rem">
            <StyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              color={COLORS.darkBlack70}
            >
              {t('your_mac_address_is', { macAddress: wifi?.macAddress })}
            </StyledText>
          </Flex>
          <Btn
            display={DISPLAY_FLEX}
            marginTop={SPACING.spacing40}
            width="100%"
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
            onClick={() => setShowAlternativeSecurityTypeModal(true)}
          >
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkBlack70}
            >
              {t('need_another_security_type')}
            </StyledText>
          </Btn>
        </Flex>
      </Flex>
    </>
  )
}
