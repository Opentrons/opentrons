import { INACCESSIBLE, SELECTED } from '../Tips/constants'
import { SelectedWell } from '../Wells/SelectedWell'
import { UNSELECTED } from './constants'
import { EmptyWell } from './EmptyWell'

import type { WellType } from '../types'

interface WellStatusProps {
  type: WellType
  size?: string
}

export function WellStatus(props: WellStatusProps): JSX.Element {
  const { type, size } = props
  switch (type) {
    case SELECTED:
      return <SelectedWell size={size} isSelected={true} showStroke={false} />
    case INACCESSIBLE:
      return <EmptyWell size={size} />
    case UNSELECTED:
      return <SelectedWell size={size} isSelected={false} showStroke={false} />
  }
}
