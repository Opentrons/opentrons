import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import {
  getRobotSerialNumber,
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
  REACHABLE,
} from '../../../../redux/discovery'
import type { ViewableRobot } from '../../../../redux/discovery/types'

interface RobotInformationProps {
  robot: ViewableRobot
}

export function RobotInformation({
  robot,
}: RobotInformationProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const serialNumber =
    robot.status === REACHABLE ? getRobotSerialNumber(robot) : null
  const firmwareVersion =
    robot.status === REACHABLE ? getRobotFirmwareVersion(robot) : null
  const protocolApiVersions =
    robot.status === REACHABLE ? getRobotProtocolApiVersion(robot) : null
  const minProtocolApiVersion = protocolApiVersions?.min ?? 'Unknown'
  const maxProtocolApiVersion = protocolApiVersions?.max ?? 'Unknown'
  const apiVersionMinMax = `v${minProtocolApiVersion} - v${maxProtocolApiVersion}`

  return (
    <Box>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginTop={SPACING.spacing4}>
        <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
          <StyledText css={TYPOGRAPHY.pSemiBold}>
            {t('robot_serial_number')}
          </StyledText>
          <StyledText as="p">
            {serialNumber != null
              ? serialNumber
              : t('robot_settings_advanced_unknown')}
          </StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
          <StyledText css={TYPOGRAPHY.pSemiBold}>
            {t('firmware_version')}
          </StyledText>
          <StyledText as="p">
            {firmwareVersion != null
              ? firmwareVersion
              : t('robot_settings_advanced_unknown')}
          </StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
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
