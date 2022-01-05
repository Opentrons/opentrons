import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  Box,
  Flex,
  Icon,
  Link,
  NewPrimaryBtn,
  Text,
  ALIGN_CENTER,
  C_BLUE,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SPACING_5,
} from '@opentrons/components'

import { startDiscovery } from '../../redux/discovery'

export const OT2_GET_STARTED_URL =
  'https://support.opentrons.com/en/collections/1559720-ot-2-get-started'
export const TROUBLESHOOTING_CONNECTION_PROBLEMS_URL =
  'https://support.opentrons.com/en/articles/2687601-troubleshooting-connection-problems'

export function DevicesEmptyState(): JSX.Element {
  const { t } = useTranslation('devices_landing')
  const dispatch = useDispatch()

  const handleRefresh = (): void => {
    dispatch(startDiscovery())
  }
  return (
    <Flex
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      padding={`${SPACING_5} 0`}
    >
      <Text as="h3" fontWeight={FONT_WEIGHT_REGULAR} paddingBottom={SPACING_2}>
        {t('no_robots_found')}
      </Text>
      <Box paddingBottom={SPACING_3}>
        <NewPrimaryBtn onClick={handleRefresh}>{t('refresh')}</NewPrimaryBtn>
      </Box>
      <Link
        external
        href={OT2_GET_STARTED_URL}
        display="flex"
        alignItems={ALIGN_CENTER}
        color={C_BLUE}
        fontSize={FONT_SIZE_BODY_1}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        paddingBottom={SPACING_2}
      >
        {t('setting_up_new_robot')}{' '}
        <Icon name="open-in-new" size="0.675rem" marginLeft={SPACING_1} />
      </Link>
      <Link
        external
        href={TROUBLESHOOTING_CONNECTION_PROBLEMS_URL}
        display="flex"
        alignItems={ALIGN_CENTER}
        color={C_BLUE}
        fontSize={FONT_SIZE_BODY_1}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
      >
        {t('troubleshooting_connection_problems')}
        <Icon name="open-in-new" size="0.675rem" marginLeft={SPACING_1} />
      </Link>
    </Flex>
  )
}
