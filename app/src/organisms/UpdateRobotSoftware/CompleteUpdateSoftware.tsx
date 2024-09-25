import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ProgressBar } from '/app/atoms/ProgressBar'

interface CompleteUpdateSoftwareProps {
  robotName: string
}
export function CompleteUpdateSoftware({
  robotName,
}: CompleteUpdateSoftwareProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'robot_controls'])

  return (
    <Flex flexDirection={DIRECTION_COLUMN} width="100%">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        backgroundColor={COLORS.grey35}
        height="33rem"
        gridGap={SPACING.spacing40}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        borderRadius={BORDERS.borderRadius12}
      >
        <LegacyStyledText
          as="h2"
          fontWeight={TYPOGRAPHY.fontWeightBold}
          color={COLORS.black90}
        >
          {t('update_complete')}
        </LegacyStyledText>
        <LegacyStyledText as="h3" marginTop={SPACING.spacing16}>
          {t('restarting_robot')}
        </LegacyStyledText>
        <Box width="47.5rem">
          <ProgressBar percentComplete={100} />
        </Box>
      </Flex>
    </Flex>
  )
}
