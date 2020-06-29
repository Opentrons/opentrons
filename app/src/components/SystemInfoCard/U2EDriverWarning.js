// @flow
import {
  ALIGN_START,
  COLOR_WARNING,
  Flex,
  FONT_WEIGHT_SEMIBOLD,
  Icon,
  Link,
  OutlineButton,
  Text,
} from '@opentrons/components'
import * as React from 'react'
import styled from 'styled-components'

import { useTrackEvent } from '../../analytics'
import {
  EVENT_U2E_DRIVER_LINK_CLICKED,
  U2E_DRIVER_OUTDATED_CTA,
  U2E_DRIVER_OUTDATED_MESSAGE,
  U2E_DRIVER_UPDATE_URL,
} from '../../system-info'

const GET_UPDATE = 'get update'

const AlertIcon = styled(Icon)`
  flex: none;
  width: 1.5rem;
  margin-top: 0.25rem;
  margin-right: 0.5rem;
`

const GetUpdateButton = styled(OutlineButton)`
  flex: none;
  margin-left: 1rem;
`

export function U2EDriverWarning(
  props: React.ElementProps<typeof Flex>
): React.Node {
  const trackEvent = useTrackEvent()

  return (
    <Flex {...props} alignItems={ALIGN_START} color={COLOR_WARNING}>
      <AlertIcon name="alert-circle" />
      <Text fontWeight={FONT_WEIGHT_SEMIBOLD}>
        {U2E_DRIVER_OUTDATED_MESSAGE} {U2E_DRIVER_OUTDATED_CTA}
      </Text>
      <GetUpdateButton
        Component={Link}
        external={true}
        href={U2E_DRIVER_UPDATE_URL}
        onClick={() => {
          trackEvent({
            name: EVENT_U2E_DRIVER_LINK_CLICKED,
            properties: { source: 'card' },
          })
        }}
      >
        {GET_UPDATE}
      </GetUpdateButton>
    </Flex>
  )
}
