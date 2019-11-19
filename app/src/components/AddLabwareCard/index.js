// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card } from '@opentrons/components'

import { getConfig } from '../../config'
import {
  changeCustomLabwareDirectory,
  addCustomLabware,
} from '../../custom-labware'

import { ManagePath } from './ManagePath'
import { AddLabware } from './AddLabware'

import type { Dispatch } from '../../types'

// TODO(mc, 2019-10-17): i18n
const ADD_LABWARE_CARD_TITLE = 'Labware Management'

export function AddLabwareCard() {
  const dispatch = useDispatch<Dispatch>()
  const config = useSelector(getConfig)
  const labwarePath = config.labware.directory
  const handleChangePath = () => dispatch(changeCustomLabwareDirectory())
  const handleAddLabware = () => dispatch(addCustomLabware())

  return (
    <Card title={ADD_LABWARE_CARD_TITLE}>
      <ManagePath path={labwarePath} onChangePath={handleChangePath} />
      <AddLabware onAddLabware={handleAddLabware} />
    </Card>
  )
}
