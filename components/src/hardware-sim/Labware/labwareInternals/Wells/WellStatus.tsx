import { INACCESSIBLE, SELECTED } from '../Tips/constants'
import { NoTip } from '../Tips/NoTip'
import { SelectedTip } from '../Tips/SelectedTip'
import { UNSELECTED } from './constants'

import type { WellType } from '../types'

interface WellStatusProps {
  type: WellType
  size?: string
}

export function WellStatus(props: WellStatusProps): JSX.Element {
  const { type, size } = props
  switch (type) {
    case SELECTED:
      return <SelectedTip size={size} isSelected={true} showStroke={false} />
    case INACCESSIBLE:
      return <NoTip size={size} />
    case UNSELECTED:
      return <SelectedTip size={size} isSelected={false} showStroke={false} />
  }
}
