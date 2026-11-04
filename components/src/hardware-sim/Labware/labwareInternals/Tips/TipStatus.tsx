import { LABWARE } from '../types'
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

import type { ReactNode } from 'react'
import type { LabwareWellMap } from '@opentrons/shared-data'
import type { TipType } from '../types'

interface TipStatusProps {
  type: TipType
  wellMap: LabwareWellMap
  wellName: string
  size: string
  text?: string
}

export function TipStatus(props: TipStatusProps): ReactNode {
  const { type, size, text, wellMap, wellName } = props
  switch (type) {
    case NEW:
      return <NewTip size={size} wellName={wellName} />
    case USED:
      return <UsedTip size={size} wellName={wellName} />
    case SELECTED:
      return (
        <SelectedWell
          size={size}
          textInsideTip={text}
          wellMap={wellMap}
          wellName={wellName}
        />
      )
    case NO:
      return (
        <EmptyWell
          size={size}
          wellMap={wellMap}
          parentType={LABWARE}
          wellName={wellName}
        />
      )
    case INACCESSIBLE:
      return <InaccessibleTip size={size} />
    case SELECTED_USED:
      return (
        <SelectedWell
          size={size}
          textInsideTip={text}
          isUsed
          wellMap={wellMap}
          wellName={wellName}
        />
      )
    case SELECTED_ERROR:
      return (
        <SelectedWell
          size={size}
          textInsideTip={text}
          isError
          wellMap={wellMap}
          wellName={wellName}
        />
      )
  }
}
