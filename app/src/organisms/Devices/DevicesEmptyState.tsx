import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Box,
  Flex,
  Icon,
  Link,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  FONT_WEIGHT_REGULAR,
  SPACING_5,
  JUSTIFY_SPACE_BETWEEN,
  COLORS,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

import { startDiscovery } from '../../redux/discovery'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'

export const OT2_GET_STARTED_URL =
  'https://support.opentrons.com/s/ot2-get-started'
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
        <StyledText
          as="h1"
          fontWeight={FONT_WEIGHT_REGULAR}
          paddingBottom={SPACING.spacing4}
          id="DevicesEmptyState_noRobotsFound"
          marginTop="20vh"
        >
          {t('no_robots_found')}
        </StyledText>
        <Box paddingBottom={SPACING.spacing4}>
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
        marginBottom={'2rem'}
      >
        {/* <Link
          external
          href={OT2_GET_STARTED_URL}
          display="flex"
          alignItems={ALIGN_CENTER}
          color={COLORS.darkBlack}
          fontSize={TYPOGRAPHY.fontSizeLabel}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          opacity={'70%'}
          paddingBottom={SPACING_2}
          id="DevicesEmptyState_settingUpNewRobot"
        >
          {t('setting_up_new_robot')}{' '}
          <Icon name="open-in-new" size="0.5rem" marginLeft={SPACING_1} />
        </Link> */}
        <Link
          external
          href={TROUBLESHOOTING_CONNECTION_PROBLEMS_URL}
          display="flex"
          alignItems={ALIGN_CENTER}
          color={COLORS.darkBlack}
          fontSize={TYPOGRAPHY.fontSizeLabel}
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          opacity={'70%'}
          id="DevicesEmptyState_troubleshootingConnectionProblems"
        >
          {t('troubleshooting_connection_problems')}
          <Icon
            name="open-in-new"
            size="0.5rem"
            marginLeft={SPACING.spacing2}
          />
        </Link>
      </Flex>
    </Flex>
  )
}
