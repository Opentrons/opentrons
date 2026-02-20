import { EmptyWell, SelectedWell } from '../Wells'
import {
  INACCESSIBLE,
  NEW,
  NO,
  SELECTED,
  SELECTED_ERROR,
  SELECTED_USED,
  USED,
} from './constants'
import { InaccessibleTip } from './InaccessibleTip'
import { NewTip } from './NewTip'
import { UsedTip } from './UsedTip'

import type { LabwareWellMap } from '@opentrons/shared-data'
import type { TipType } from '../types'

interface TipStatusProps {
  type: TipType
  wellMap: LabwareWellMap
  size?: string
  text?: string
}

export function TipStatus(props: TipStatusProps): JSX.Element {
  const { type, size, text, wellMap } = props
  switch (type) {
    case NEW:
      return <NewTip size={size} />
    case USED:
      return <UsedTip size={size} />
    case SELECTED:
      return <SelectedWell size={size} textInsideTip={text} wellMap={wellMap} />
    case NO:
      return <EmptyWell size={size} wellMap={wellMap} />
    case INACCESSIBLE:
      return <InaccessibleTip size={size} />
    case SELECTED_USED:
      return (
        <SelectedWell
          size={size}
          textInsideTip={text}
          isUsed
          wellMap={wellMap}
        />
      )
    case SELECTED_ERROR:
      return (
        <SelectedWell
          size={size}
          textInsideTip={text}
          isError
          wellMap={wellMap}
        />
      )
  }
}
