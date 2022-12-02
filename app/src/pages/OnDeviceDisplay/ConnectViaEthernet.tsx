import * as React from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import capitalize from 'lodash/capitalize'

import {
  Flex,
  SPACING,
  TYPOGRAPHY,
  useInterval,
  Icon,
  Btn,
  COLORS,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  SIZE_2,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
  ALIGN_FLEX_END,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
} from '@opentrons/components'

import { getNetworkInterfaces, fetchStatus } from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import { StepMeter } from '../../atoms/StepMeter'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'

import type { State, Dispatch } from '../../redux/types'

const STATUS_REFRESH_MS = 5000

export function ConnectViaEthernet(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [isConnected, setIsConnected] = React.useState<boolean>(false)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const dispatch = useDispatch<Dispatch>()

  const { ethernet } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const ipAddress = ethernet?.ipAddress
  const subnetMask = ethernet?.subnetMask
  const macAddress = ethernet?.macAddress
  const headerTitle = t('connect_via', { type: t('ethernet') })

  useInterval(() => dispatch(fetchStatus(robotName)), STATUS_REFRESH_MS, true)

  React.useEffect(() => {
    setIsConnected(ipAddress != null && subnetMask != null)
  }, [ipAddress, subnetMask])

  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} OnDevice />
      <Flex
        margin={`${String(SPACING.spacing6)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacingXXL)}`}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing5}
      >
        <TitleHeader title={headerTitle} />
        <DisplayConnectionStatus isConnected={isConnected} />
        <DisplayEthernetInfo
          isConnected={isConnected}
          ipAddress={ipAddress}
          subnetMask={subnetMask}
          macAddress={macAddress}
        />
        {isConnected ? (
          <Flex
            justifyContent={JUSTIFY_FLEX_END}
            alignSelf={ALIGN_FLEX_END}
            marginTop="3.75rem"
          >
            <PrimaryButton
              width="11.875rem"
              height="4.4375rem"
              onClick={() => console.log('move to name screen')}
              fontSize="1.5rem"
              lineHeight="1.375rem"
              fontWeight="500"
            >
              {t('next_step')}
            </PrimaryButton>
          </Flex>
        ) : null}
      </Flex>
    </>
  )
}

interface TitleHeaderProps {
  title: string
}
// ToDo kj:12/01/2022 create header component for touchscreen app
// refactor prop title and path
const TitleHeader = ({ title }: TitleHeaderProps): JSX.Element => {
  const history = useHistory()
  const { t } = useTranslation('shared')
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      marginBottom="1.5625rem"
      position={POSITION_RELATIVE}
    >
      <Btn onClick={() => history.push('/network-setup-menu')}>
        <Flex
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_ROW}
          position={POSITION_ABSOLUTE}
          top="10%"
          left="0%"
        >
          <Icon
            name="arrow-back"
            marginRight={SPACING.spacing2}
            size="1.875rem"
          />
          <StyledText
            fontSize="1.625rem"
            lineHeight="2.1875rem"
            fontWeight="700"
          >
            {t('back')}
          </StyledText>
        </Flex>
      </Btn>
      <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
        {title}
      </StyledText>
    </Flex>
  )
}

interface DisplayConnectionStatusProps {
  isConnected: boolean
}

const DisplayConnectionStatus = ({
  isConnected,
}: DisplayConnectionStatusProps): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <>
      {isConnected ? (
        <Flex
          flexDirection={DIRECTION_ROW}
          padding={`${String(SPACING.spacing5)} ${String(SPACING.spacingXXL)}`}
          backgroundColor={COLORS.successBackgroundMed}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
        >
          <Icon name="ot-check" size="2.5rem" color={COLORS.successEnabled} />
          <StyledText
            marginLeft={SPACING.spacing5}
            fontSize="1.625rem"
            fontWeight="700"
            lineHeight="2.1875rem"
            color={COLORS.black}
          >
            {t('connection_status')}
          </StyledText>
          <StyledText
            marginLeft="0.625rem"
            fontSize="1.625rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            lineHeight="2.1875rem"
            color={COLORS.black}
          >
            {t('connected')}
          </StyledText>
        </Flex>
      ) : (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          padding={`${String(SPACING.spacing5)} ${String(SPACING.spacingXXL)}`}
          backgroundColor={COLORS.greyDisabled}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
        >
          <Flex flexDirection={DIRECTION_ROW}>
            <StyledText
              marginLeft={SPACING.spacing5}
              fontSize="1.625rem"
              fontWeight="700"
              lineHeight="2.1875rem"
              color={COLORS.black}
            >
              {t('connection_status')}
            </StyledText>
            <StyledText
              marginLeft="0.625rem"
              fontSize="1.625rem"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
              lineHeight="2.1875rem"
              color={COLORS.black}
            >
              {t('no_network_found')}
            </StyledText>
          </Flex>
          <StyledText
            marginLeft="0.625rem"
            fontSize="1.625rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            lineHeight="2.1875rem"
            textAlign={TYPOGRAPHY.textAlignCenter}
            color={COLORS.darkGreyEnabled}
          >
            {t('no_network_found_description')}
          </StyledText>
        </Flex>
      )}
    </>
  )
}

interface DisplayEthernetInfoProps {
  isConnected: boolean
  ipAddress?: string | null
  subnetMask?: string | null
  macAddress?: string | null
}

const DisplayEthernetInfo = ({
  isConnected,
  ipAddress,
  subnetMask,
  macAddress,
}: DisplayEthernetInfoProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])

  return (
    <Flex
      backgroundColor={COLORS.greyDisabled}
      flexDirection={DIRECTION_COLUMN}
    >
      <Flex
        padding={`${String(SPACING.spacing5)} ${String(SPACING.spacing6)}}`}
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
        >
          <Icon name="ethernet" size={SIZE_2} />
          <StyledText
            fontSize="1.5rem"
            lineHeight="2.0625rem"
            fontWeight="700"
            marginLeft="0.833125rem"
          >
            {isConnected ? t('ethernet') : t('no_network_found')}
          </StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3}>
          <StyledText
            fontSize="1.5rem"
            lineHeight="2.0625rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.black}
          >
            {t('ip_address')}:{' '}
            {ipAddress != null ? ipAddress : capitalize(t('shared:no_data'))}
          </StyledText>
          <StyledText
            fontSize="1.5rem"
            lineHeight="2.0625rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.black}
          >
            {t('subnet_mask')}:{' '}
            {subnetMask != null ? subnetMask : capitalize(t('shared:no_data'))}
          </StyledText>
          <StyledText
            fontSize="1.5rem"
            lineHeight="2.0625rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.black}
          >
            {t('mac_address')}:{' '}
            {/* Note: technically no data for MAC Address isn't necessary but just in case */}
            {macAddress != null ? macAddress : capitalize(t('shared:no_data'))}
          </StyledText>
        </Flex>
      </Flex>
    </Flex>
  )
}
