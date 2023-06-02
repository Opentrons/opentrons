import * as React from 'react'
import {
  ALIGN_FLEX_START,
  DIRECTION_ROW,
  Flex,
  OVERFLOW_HIDDEN,
  SPACING,
  useSwipe,
} from '@opentrons/components'
import { RecentRunProtocolCard } from './RecentRunProtocolCard'

import type { RunData } from '@opentrons/api-client'

interface RecentRunProtocolCarouselProps {
  recentRunsOfUniqueProtocols: RunData[]
}

export function RecentRunProtocolCarousel({
  recentRunsOfUniqueProtocols,
}: RecentRunProtocolCarouselProps): JSX.Element {
  // const swipe = useSwipe()

  // const slider = (swipe.ref.current as unknown) as HTMLDivElement
  // let isDown = false
  // let startX = 0
  // let scrollLeft = 0

  // const handleMouseDown = (e: React.MouseEvent<Element, MouseEvent>): void => {
  //   isDown = true
  //   startX = e.pageX - slider.offsetLeft
  //   scrollLeft = slider.scrollLeft
  // }

  // const handleMouseLeave = (): void => {
  //   isDown = false
  // }

  // const handleMouseUp = (): void => {
  //   isDown = false
  // }

  // const handleMouseMove = (e: React.MouseEvent<Element, MouseEvent>): void => {
  //   if (!isDown) return
  //   e.preventDefault()
  //   const x = e.pageX - slider.offsetLeft
  //   const walk = (x - startX) * 3
  //   slider.scrollLeft = scrollLeft - walk
  // }

  // if (swipe.swipeType === 'swipe-left' || swipe.swipeType === 'swipe-right') {
  //   const walk = swipe.swipeType === 'swipe-left' ? -800 : 800
  //   slider.scrollLeft = slider.scrollLeft - walk
  //   swipe.setSwipeType('')
  // }

  // We set a negative right margin to give the illusion of the carousel spilling
  // off the page, as per the designs.
  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing8}
      // ref={swipe.ref}
      marginRight={`-${SPACING.spacing40}`}
      // onMouseDown={handleMouseDown}
      // onMouseLeave={handleMouseLeave}
      // onMouseMove={handleMouseMove}
      // onMouseUp={handleMouseUp}
      overflowX='scroll'
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
        {recentRunsOfUniqueProtocols.map((runData) => (
          <RecentRunProtocolCard key={runData.id} runData={runData} />
        ))}
      </Flex>
    </Flex>
  )
}
