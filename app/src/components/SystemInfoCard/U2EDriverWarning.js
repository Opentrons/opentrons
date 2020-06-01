// @flow
import * as React from 'react'
import styled from 'styled-components'

import {
  Flex,
  Icon,
  Text,
  Link,
  OutlineButton,
  ALIGN_START,
  COLOR_WARNING,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'

import {
  U2E_DRIVER_UPDATE_URL,
  EVENT_U2E_DRIVER_LINK_CLICKED,
  U2E_DRIVER_OUTDATED_MESSAGE,
  U2E_DRIVER_OUTDATED_CTA,
} from '../../system-info'

import { useTrackEvent } from '../../analytics'

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
