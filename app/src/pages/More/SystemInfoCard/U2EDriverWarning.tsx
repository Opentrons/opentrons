import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  Flex,
  Icon,
  Text,
  Link,
  ALIGN_CENTER,
  C_BLUE,
  COLOR_WARNING,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
} from '@opentrons/components'

import {
  U2E_DRIVER_UPDATE_URL,
  EVENT_U2E_DRIVER_LINK_CLICKED,
} from '../../../redux/system-info'

import { useTrackEvent } from '../../../redux/analytics'

const AlertIcon = styled(Icon)`
  flex: none;
  width: 1.5rem;
  margin-top: 0.25rem;
  margin-right: 0.5rem;
`

export function U2EDriverWarning(
  props: React.ComponentProps<typeof Flex>
): JSX.Element {
  const trackEvent = useTrackEvent()
  const { t } = useTranslation(['more_network_and_system', 'shared'])

  return (
    <>
      <Text as="li" marginBottom={SPACING_2}>
        {t('u2e_adapter_description')}
      </Text>
      <Flex {...props} alignItems={ALIGN_CENTER} color={COLOR_WARNING}>
        <AlertIcon name="alert-circle" />
        <Text fontWeight={FONT_WEIGHT_SEMIBOLD} fontSize={FONT_SIZE_BODY_2}>
          {t('u2e_driver_update_alert')}
        </Text>
      </Flex>
      <Text as="li" marginBottom={SPACING_2}>
        <Link
          color={C_BLUE}
          external={true}
          href={U2E_DRIVER_UPDATE_URL}
          onClick={() => {
            trackEvent({
              name: EVENT_U2E_DRIVER_LINK_CLICKED,
              properties: { source: 'card' },
            })
          }}
        >
          {t('launch_realtek_adapter_drivers_site')}
          <Icon name="open-in-new" size="0.675rem" marginLeft={SPACING_1} />
        </Link>
      </Text>
    </>
  )
}
