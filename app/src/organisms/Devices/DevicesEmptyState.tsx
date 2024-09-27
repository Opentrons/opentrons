import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  Flex,
  FONT_WEIGHT_REGULAR,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  POSITION_ABSOLUTE,
  PrimaryButton,
  SPACING_5,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { startDiscovery } from '/app/redux/discovery'

export const TROUBLESHOOTING_CONNECTION_PROBLEMS_URL =
  'https://support.opentrons.com/s/article/Troubleshooting-connection-problems'

export function DevicesEmptyState(): JSX.Element {
  const { t } = useTranslation('devices_landing')
  const dispatch = useDispatch()

  const handleRefresh = (): void => {
    dispatch(startDiscovery())
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      paddingTop={SPACING_5}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
    >
      <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
        <LegacyStyledText
          as="h1"
          fontWeight={FONT_WEIGHT_REGULAR}
          paddingBottom={SPACING.spacing16}
          id="DevicesEmptyState_noRobotsFound"
          marginTop="20vh"
        >
          {t('no_robots_found')}
        </LegacyStyledText>
        <Box paddingBottom={SPACING.spacing16}>
          <PrimaryButton
            onClick={handleRefresh}
            id="DevicesEmptyState_refreshButton"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {t('refresh')}
          </PrimaryButton>
        </Box>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        position={POSITION_ABSOLUTE}
        bottom={SPACING.spacing40}
        left="0"
        right="0"
        marginLeft={SPACING.spacingAuto}
        marginRight={SPACING.spacingAuto}
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        <Link
          css={TYPOGRAPHY.darkLinkLabelSemiBold}
          external
          href={TROUBLESHOOTING_CONNECTION_PROBLEMS_URL}
          display={DISPLAY_FLEX}
          alignItems={ALIGN_CENTER}
          id="DevicesEmptyState_troubleshootingConnectionProblems"
        >
          {t('troubleshooting_connection_problems')}
          <Icon
            name="open-in-new"
            size="0.5rem"
            marginLeft={SPACING.spacing4}
          />
        </Link>
      </Flex>
    </Flex>
  )
}
