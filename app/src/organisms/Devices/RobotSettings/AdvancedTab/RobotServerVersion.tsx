import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Box,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  Link,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { getRobotApiVersion } from '../../../../redux/discovery'
import type { ViewableRobot } from '../../../../redux/discovery/types'

interface RobotServerVersionProps {
  robot: ViewableRobot
}

const GITHUB_LINK =
  'https://github.com/Opentrons/opentrons/blob/edge/app-shell/build/release-notes.md'

export function RobotServerVersion({
  robot,
}: RobotServerVersionProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const robotServerVersion = getRobotApiVersion(robot as ViewableRobot)

  return (
    <Flex alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box width="70%">
        <StyledText
          as="h3"
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing3}
          id="AdvancedSettings_RobotServerVersion"
        >
          {t('robot_server_versions')}
        </StyledText>
        <StyledText
          css={TYPOGRAPHY.h6Default}
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          paddingBottom={SPACING.spacing2}
        >
          {`v${robotServerVersion}`}
        </StyledText>
        <StyledText as="p">
          {t('robot_server_versions_description')}
          <Link
            external
            href={GITHUB_LINK}
            id="AdvancedSettings_GitHubLink"
          >{` ${t('github')}`}</Link>
        </StyledText>
      </Box>
    </Flex>
  )
}
