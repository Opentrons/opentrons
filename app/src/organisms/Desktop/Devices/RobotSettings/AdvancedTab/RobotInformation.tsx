import { useTranslation } from 'react-i18next'
import {
  Box,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_START,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useRobot } from '/app/redux-resources/robots'
import {
  getRobotSerialNumber,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '/app/redux/discovery'

interface RobotInformationProps {
  robotName: string
}

export function RobotInformation({
  robotName,
}: RobotInformationProps): JSX.Element | null {
  const { t } = useTranslation('device_settings')
  const robot = useRobot(robotName)
  const serialNumber =
    robot?.status != null ? getRobotSerialNumber(robot) : null
  const firmwareVersion =
    robot?.status != null ? getRobotFirmwareVersion(robot) : null
  const protocolApiVersions =
    robot?.status != null ? getRobotProtocolApiVersion(robot) : null
  const minProtocolApiVersion = protocolApiVersions?.min ?? null
  const maxProtocolApiVersion = protocolApiVersions?.max ?? null

  const formatApiVersionMinMax = (): string => {
    if (minProtocolApiVersion === maxProtocolApiVersion) {
      return `v${minProtocolApiVersion}`
    } else if (minProtocolApiVersion != null && maxProtocolApiVersion != null) {
      return `v${minProtocolApiVersion} - v${maxProtocolApiVersion}`
    } else {
      return t('robot_settings_advanced_unknown')
    }
  }

  return (
    <Box>
      <Flex
        gridGap={SPACING.spacing16}
        justifyContent={JUSTIFY_FLEX_START}
        marginTop={SPACING.spacing16}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
            {t('robot_serial_number')}
          </LegacyStyledText>
          <LegacyStyledText as="p">
            {serialNumber != null
              ? serialNumber
              : t('robot_settings_advanced_unknown')}
          </LegacyStyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
            {t('firmware_version')}
          </LegacyStyledText>
          <LegacyStyledText as="p">
            {firmwareVersion != null
              ? firmwareVersion
              : t('robot_settings_advanced_unknown')}
          </LegacyStyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <LegacyStyledText css={TYPOGRAPHY.pSemiBold}>
            {t('supported_protocol_api_versions')}
          </LegacyStyledText>
          <LegacyStyledText as="p">{formatApiVersionMinMax()}</LegacyStyledText>
        </Flex>
      </Flex>
    </Box>
  )
}
