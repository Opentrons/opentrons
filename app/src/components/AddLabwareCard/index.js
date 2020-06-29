// @flow
import { Card } from '@opentrons/components'
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  addCustomLabware,
  changeCustomLabwareDirectory,
  clearAddCustomLabwareFailure,
  getAddLabwareFailure,
  getCustomLabwareDirectory,
  openCustomLabwareDirectory,
  resetCustomLabwareDirectory,
} from '../../custom-labware'
import type { Dispatch } from '../../types'
import { CardCopy } from '../layout'
import { AddLabware } from './AddLabware'
import { AddLabwareFailureModal } from './AddLabwareFailureModal'
import { ManagePath } from './ManagePath'

// TODO(mc, 2019-10-17): i18n
const LABWARE_MANAGEMENT = 'Labware Management'
const MANAGE_CUSTOM_LABWARE_DEFINITIONS =
  'Manage custom labware definitions for use in your Python Protocol API Version 2 protocols.'

export function AddLabwareCard(): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const labwarePath = useSelector(getCustomLabwareDirectory)
  const addFailure = useSelector(getAddLabwareFailure)
  const handleOpenPath = () => dispatch(openCustomLabwareDirectory())
  const handleResetPath = () => dispatch(resetCustomLabwareDirectory())
  const handleChangePath = () => dispatch(changeCustomLabwareDirectory())
  const handleAddLabware = () => dispatch(addCustomLabware())
  const showAddFailure = addFailure.file || addFailure.errorMessage !== null

  return (
    <Card title={LABWARE_MANAGEMENT}>
      <CardCopy>{MANAGE_CUSTOM_LABWARE_DEFINITIONS}</CardCopy>
      <ManagePath
        path={labwarePath}
        onOpenPath={handleOpenPath}
        onResetPath={handleResetPath}
        onChangePath={handleChangePath}
      />
      <AddLabware onAddLabware={handleAddLabware} />
      {showAddFailure && (
        <AddLabwareFailureModal
          {...addFailure}
          directory={labwarePath}
          onCancel={() => dispatch(clearAddCustomLabwareFailure())}
          onOverwrite={file => dispatch(addCustomLabware(file))}
        />
      )}
    </Card>
  )
}
