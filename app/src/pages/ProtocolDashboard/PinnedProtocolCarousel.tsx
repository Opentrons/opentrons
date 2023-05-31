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
import type { CardSizeType } from './PinnedProtocol'

export function PinnedProtocolCarousel(props: {
  pinnedProtocols: ProtocolResource[]
  longPress: React.Dispatch<React.SetStateAction<boolean>>
  setShowDeleteConfirmationModal: (showDeleteConfirmationModal: boolean) => void
}): JSX.Element {
  const { pinnedProtocols, longPress, setShowDeleteConfirmationModal } = props
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

  // Scrolling on the ODD is entirely controlled here, since it doesn't use
  // mouse events on the touchscreen. The 800px scrolling is an arbitrary
  // amount that felt the least janky to me in actual use.
  if (swipe.swipeType === 'swipe-left' || swipe.swipeType === 'swipe-right') {
    const walk = swipe.swipeType === 'swipe-left' ? -800 : 800
    slider.scrollLeft = slider.scrollLeft - walk
    swipe.setSwipeType('')
  }

  const cardSize = (): CardSizeType => {
    let size: CardSizeType = 'regular'
    if (pinnedProtocols.length < 3) {
      size = pinnedProtocols.length === 1 ? 'full' : 'half'
    }
    return size
  }

  // We set a negative right margin to give the illusion of the carousel spilling
  // off the page, as per the designs.
  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing8}
      ref={swipe.ref}
      marginRight={pinnedProtocols.length < 3 ? '0' : `-${SPACING.spacing40}`}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      overflow={OVERFLOW_HIDDEN}
    >
      {pinnedProtocols.map(protocol => {
        const lastRun = runs.data?.data.find(
          run => run.protocolId === protocol.id
        )?.createdAt
        return (
          <PinnedProtocol
            cardSize={cardSize()}
            key={protocol.key}
            lastRun={lastRun}
            protocol={protocol}
            longPress={longPress}
            setShowDeleteConfirmationModal={setShowDeleteConfirmationModal}
          />
        )
      })}
    </Flex>
  )
}
