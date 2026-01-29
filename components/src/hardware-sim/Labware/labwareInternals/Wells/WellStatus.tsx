import { INACCESSIBLE, SELECTED } from '../Tips/constants'
import { NoTip } from '../Tips/NoTip'
import { SelectedTip } from '../Tips/SelectedTip'
import { UNSELECTED } from './constants'

import type { WellType } from '../types'

export function WellStatus(props: {
  type: WellType
  size?: string
}): JSX.Element {
  const { type, size } = props
  switch (type) {
    case SELECTED:
      return <SelectedTip size={size} selected={true} textInsideTip={''} />
    case INACCESSIBLE:
      return <NoTip size={size} />
    case UNSELECTED:
      return <SelectedTip size={size} selected={false} textInsideTip={''} />
  }
}
