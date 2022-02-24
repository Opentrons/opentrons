import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useInterval } from '@opentrons/components'
import { getAllDefinitions } from '@opentrons/shared-data'
import {
  fetchCustomLabware,
  getCustomLabware,
} from '../../redux/custom-labware'

import type { Dispatch } from '../../redux/types'
import type { LabwareDefinition2 as LabwareDefiniton } from '@opentrons/shared-data'

const LABWARE_REFRESH_INTERVAL_MS = 5000

export interface LabwareDefAndDate {
  definition: LabwareDefiniton
  modified?: number
}

export function useGetAllLabware(): LabwareDefAndDate[] {
  const dispatch = useDispatch<Dispatch>()
  const fullLabwareList: LabwareDefAndDate[] = []
  const labwareDefinitons = getAllDefinitions()
  labwareDefinitons.map(def => fullLabwareList.push({ definition: def }))

  // pull definition and modified date from here
  const customLabwareList = useSelector(getCustomLabware)

  // create super array with all definitions, optional modified date as array of objects
  // maybe do this in a hook.....
  const fetchLabware = React.useCallback(() => dispatch(fetchCustomLabware()), [
    dispatch,
  ])

  useInterval(fetchLabware, LABWARE_REFRESH_INTERVAL_MS, true)
  customLabwareList.map(customLabware =>
    'definition' in customLabware
      ? fullLabwareList.push({
          modified: customLabware.modified,
          definition: customLabware.definition,
        })
      : null
  )

  return fullLabwareList
}
