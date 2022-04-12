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
  getRobotFirmwareVersion,
  getRobotProtocolApiVersion,
} from '../../../../redux/discovery'
import { ViewableRobot } from '../../../../redux/discovery/types'

interface RobotInformationProps {
  robot: ViewableRobot
}

export function RobotInformation({
  robot,
}: RobotInformationProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'robot_info'])
  // TODO: serialNumber
  const firmwareVersion = getRobotFirmwareVersion(robot as ViewableRobot)
  const protocolApiVersions = getRobotProtocolApiVersion(robot as ViewableRobot)
  const minProtocolApiVersion = protocolApiVersions?.min ?? 'Unknown'
  const maxProtocolApiVersion = protocolApiVersions?.max ?? 'Unknown'
  const apiVersionMinMax = t('robot_info:api_version_min_max', {
    min: minProtocolApiVersion,
    max: maxProtocolApiVersion,
  })

  return (
    <Box>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginTop={SPACING.spacing4}>
        <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
          <StyledText css={TYPOGRAPHY.pSemiBold}>
            {t('robot_serial_number')}
          </StyledText>
          <StyledText as="p">{'robot serial number'}</StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
          <StyledText css={TYPOGRAPHY.pSemiBold}>
            {t('firmware_version')}
          </StyledText>
          <StyledText as="p">{firmwareVersion}</StyledText>
        </Flex>
        <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
          <StyledText css={TYPOGRAPHY.pSemiBold}>
            {t('supported_protocol_api_versions')}
          </StyledText>
          <StyledText as="p">{apiVersionMinMax}</StyledText>
        </Flex>
      </Flex>
    </Box>
  )
}
