import * as React from 'react'
import {
  ALIGN_FLEX_START,
  DIRECTION_ROW,
  Flex,
  OVERFLOW_HIDDEN,
  SPACING,
  useSwipe,
} from '@opentrons/components'
import { useAllRunsQuery } from '@opentrons/react-api-client'
import { RecentRunProtocolCard } from './RecentRunProtocolCard'

import type { ProtocolResource } from '@opentrons/shared-data'

interface RecentRunProtocolCarouselProps {
  sortedProtocols: ProtocolResource[]
}

export function RecentRunProtocolCarousel({
  sortedProtocols,
}: RecentRunProtocolCarouselProps): JSX.Element {
  const runs = useAllRunsQuery()
  const swipe = useSwipe()

  const slider = (swipe.ref.current as unknown) as HTMLDivElement
  let isDown = false
  let startX = 0
  let scrollLeft = 0

  const handleMouseDown = (e: React.MouseEvent<Element, MouseEvent>): void => {
    isDown = true
    startX = e.pageX - slider.offsetLeft
    scrollLeft = slider.scrollLeft
  }

  const handleMouseLeave = (): void => {
    isDown = false
  }

  const handleMouseUp = (): void => {
    isDown = false
  }

  const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>): void => {
    if (!isDown) return
    e.preventDefault()
    const x = e.pageX - slider.offsetLeft
    const walk = (x - startX) * 3
    slider.scrollLeft = scrollLeft - walk
  }

  if (swipe.swipeType === 'swipe-left' || swipe.swipeType === 'swipe-right') {
    const walk = swipe.swipeType === 'swipe-left' ? -800 : 800
    slider.scrollLeft = slider.scrollLeft - walk
    swipe.setSwipeType('')
  }

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing8}
      ref={swipe.ref}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      overflow={OVERFLOW_HIDDEN}
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
        {sortedProtocols.map((protocol: ProtocolResource) => {
          const run = runs.data?.data.find(
            run => run.protocolId === protocol.id
          )
          const protocolId = protocol.id
          const protocolName =
            protocol.metadata.protocolName ?? protocol.files[0].name

          return (
            <React.Fragment key={protocolId}>
              {run ? (
                <RecentRunProtocolCard
                  lastRun={run?.createdAt}
                  protocolId={protocolId}
                  protocolName={protocolName}
                  runId={run?.id}
                />
              ) : null}
            </React.Fragment>
          )
        })}
      </Flex>
    </Flex>
  )
}
