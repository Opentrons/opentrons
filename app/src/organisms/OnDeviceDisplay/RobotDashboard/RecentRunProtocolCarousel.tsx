import * as React from 'react'
import {
  ALIGN_FLEX_START,
  DIRECTION_ROW,
  Flex,
  SPACING,
  Box
} from '@opentrons/components'
import { RecentRunProtocolCard } from './RecentRunProtocolCard'

import type { RunData } from '@opentrons/api-client'
import styled from 'styled-components'

interface RecentRunProtocolCarouselProps {
  recentRunsOfUniqueProtocols: RunData[]
}

const CarouselWrapper = styled.div`
  display: flex;
  flex-direction: ${DIRECTION_ROW};
  align-items: ${ALIGN_FLEX_START};
  margin-right: -${SPACING.spacing40};
  margin-left: -${SPACING.spacing40};
  overflow-x: scroll;

  &::-webkit-scrollbar {
    display: none;
  }
`

export function RecentRunProtocolCarousel({
  recentRunsOfUniqueProtocols,
}: RecentRunProtocolCarouselProps): JSX.Element {
  // We set a negative right margin to give the illusion of the carousel spilling
  // off the page, as per the designs.
  return (
    <CarouselWrapper>
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8} marginX={SPACING.spacing40}>
        {recentRunsOfUniqueProtocols.map((runData) => (
          <RecentRunProtocolCard key={runData.id} runData={runData} />
        ))}
      </Flex>
    </CarouselWrapper>
  )
}
