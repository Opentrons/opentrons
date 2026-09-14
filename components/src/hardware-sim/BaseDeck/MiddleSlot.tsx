import { SlotBase } from './SlotBase'
import { SlotClip } from './SlotClip'

import type { ReactNode, SVGProps } from 'react'

export interface MiddleSlotProps {
  showSlotClips: boolean
  fixtureBaseColor: SVGProps<SVGPathElement>['fill']
  slotClipColor: SVGProps<SVGPathElement>['stroke']
  stroke?: string
}
// This slot is based of coordinates of slot A2. To reuse, wrap in <g transpose(x, y)>
export function MiddleSlot(props: MiddleSlotProps): ReactNode {
  const { showSlotClips, fixtureBaseColor, slotClipColor, stroke } = props
  return (
    <>
      <SlotBase
        d="M150.8,417.1h154.3c2.4,0,4.3-1.9,4.3-4.3v-97.4c0-2.4-1.9-4.3-4.3-4.3H150.8c-2.4,0-4.3,1.9-4.3,4.3v97.4C146.5,415.1,148.4,417.1,150.8,417.1z"
        fill={fixtureBaseColor}
        stroke={stroke}
        strokeWidth={2}
      />
      {showSlotClips ? (
        <>
          <SlotClip d="M162.1,398.9V409h10.8" stroke={slotClipColor} />
          <SlotClip d="M162.1,329.8v-10.5h10.6" stroke={slotClipColor} />
          <SlotClip d="M293.9,398.9V409h-10.8" stroke={slotClipColor} />
          <SlotClip d="M293.9,329.8v-10.7h-10.8" stroke={slotClipColor} />
        </>
      ) : null}
    </>
  )
}
