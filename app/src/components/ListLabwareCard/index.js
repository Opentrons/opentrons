// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useInterval } from '@opentrons/components'

import ListCard from './ListCard'
import LabwareItem from './LabwareItem'
import { fetchCustomLabware, getValidCustomLabware } from '../../custom-labware'

import type { Dispatch } from '../../types'

const LABWARE_REFRESH_INTERVAL_MS = 5000

export function ListLabwareCard() {
  const dispatch = useDispatch<Dispatch>()
  const validLabware = useSelector(getValidCustomLabware)
  const fetchLabware = React.useCallback(() => dispatch(fetchCustomLabware()), [
    dispatch,
  ])

  useInterval(fetchLabware, LABWARE_REFRESH_INTERVAL_MS, true)

  return (
    <ListCard>
      {validLabware.map(f => (
        <LabwareItem
          key={f.filename}
          name={f.identity.name}
          version={f.identity.version}
          displayName={f.metadata.displayName}
          displayCategory={f.metadata.displayCategory}
          dateAdded={f.created}
        />
      ))}
    </ListCard>
  )
}
