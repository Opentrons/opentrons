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
import { PinnedProtocol } from './PinnedProtocol'

import type { ProtocolResource } from '@opentrons/shared-data'

export function PinnedProtocolCarousel(props: {
  pinnedProtocols: ProtocolResource[]
}): JSX.Element {
  const { pinnedProtocols } = props
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
    const walk = (x - startX) * 3 // scroll-fast
    slider.scrollLeft = scrollLeft - walk
  }

  const cardSize =
    pinnedProtocols.length === 1
      ? 'full'
      : pinnedProtocols.length === 2
      ? 'half'
      : 'regular'

  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_FLEX_START}
      gridGap={SPACING.spacing3}
      ref={swipe.ref}
      overflow={OVERFLOW_HIDDEN}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {pinnedProtocols.map(protocol => {
        const lastRun = runs.data?.data.find(
          run => run.protocolId === protocol.id
        )?.createdAt
        return (
          <PinnedProtocol
            cardSize={cardSize}
            key={protocol.key}
            lastRun={lastRun}
            protocol={protocol}
          />
        )
      })}
    </Flex>
  )
}
