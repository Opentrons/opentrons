// @flow
import { Card, useInterval } from '@opentrons/components'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  fetchCustomLabware,
  getCustomLabware,
  getListLabwareErrorMessage,
} from '../../custom-labware'
import type { Dispatch } from '../../types'
import { LabwareList } from './LabwareList'

const LABWARE_REFRESH_INTERVAL_MS = 5000

// TODO(mc, 2019-11-21): i18n
const CUSTOM_LABWARE_LIST = 'Custom Labware List'

export function ListLabwareCard(): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const labware = useSelector(getCustomLabware)
  const listLabwareError = useSelector(getListLabwareErrorMessage)
  const fetchLabware = React.useCallback(() => dispatch(fetchCustomLabware()), [
    dispatch,
  ])

  useInterval(fetchLabware, LABWARE_REFRESH_INTERVAL_MS, true)

  return (
    <Card title={CUSTOM_LABWARE_LIST}>
      <LabwareList labware={labware} errorMessage={listLabwareError} />
    </Card>
  )
}
