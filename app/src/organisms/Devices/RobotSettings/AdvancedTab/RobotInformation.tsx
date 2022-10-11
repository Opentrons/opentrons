import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  Box,
  JUSTIFY_FLEX_START,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { useRobot } from '../../../../organisms/Devices/hooks'
import {
  getRobotSerialNumber,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '../../../../redux/discovery'

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
  const apiVersionMinMax =
    minProtocolApiVersion != null && maxProtocolApiVersion != null
      ? `v${minProtocolApiVersion} - v${maxProtocolApiVersion}`
      : t('robot_settings_advanced_unknown')

  return (
    <Box>
      <Flex
        gridGap={SPACING.spacing4}
        justifyContent={JUSTIFY_FLEX_START}
        marginTop={SPACING.spacing4}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText css={TYPOGRAPHY.pSemiBold}>
            {t('robot_serial_number')}
          </StyledText>
          <StyledText as="p">
            {serialNumber != null
              ? serialNumber
              : t('robot_settings_advanced_unknown')}
          </StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText css={TYPOGRAPHY.pSemiBold}>
            {t('firmware_version')}
          </StyledText>
          <StyledText as="p">
            {firmwareVersion != null
              ? firmwareVersion
              : t('robot_settings_advanced_unknown')}
          </StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText css={TYPOGRAPHY.pSemiBold}>
            {t('supported_protocol_api_versions')}
          </StyledText>
          <StyledText as="p">
            {apiVersionMinMax != null
              ? apiVersionMinMax
              : t('robot_settings_advanced_unknown')}
          </StyledText>
        </Flex>
      </Flex>
    </Box>
  )
}
