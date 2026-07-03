import styled from 'styled-components'

import {
  ALIGN_FLEX_START,
  DIRECTION_ROW,
  Flex,
  SPACING,
} from '@opentrons/components'

import { RecentRunProtocolCard } from './RecentRunProtocolCard'

import type { RunData } from '@opentrons/api-client'

interface RecentRunProtocolCarouselProps {
  recentRunsOfUniqueProtocols: RunData[]
  onCardResolved: (runId: string, isStandard: boolean) => void
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
  onCardResolved,
}: RecentRunProtocolCarouselProps): JSX.Element {
  return (
    <CarouselWrapper>
      <Flex
        flexDirection={DIRECTION_ROW}
        gridGap={SPACING.spacing8}
        marginX={SPACING.spacing40}
      >
        {recentRunsOfUniqueProtocols.map(runData => (
          <RecentRunProtocolCard
            key={runData.id}
            runData={runData}
            onCardResolved={onCardResolved}
          />
        ))}
      </Flex>
    </CarouselWrapper>
  )
}
