import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card } from '@opentrons/components'

import {
  getCustomLabwareDirectory,
  openCustomLabwareDirectory,
  changeCustomLabwareDirectory,
  resetCustomLabwareDirectory,
  addCustomLabware,
  clearAddCustomLabwareFailure,
  getAddLabwareFailure,
} from '../../../redux/custom-labware'

import { CardCopy } from '../../../atoms/layout'
import { ManagePath } from './ManagePath'
import { AddLabware } from './AddLabware'
import { AddLabwareFailureModal } from './AddLabwareFailureModal'

import type { Dispatch } from '../../../redux/types'

// TODO(mc, 2019-10-17): i18n
const LABWARE_MANAGEMENT = 'Labware Management'
const MANAGE_CUSTOM_LABWARE_DEFINITIONS =
  'Manage custom labware definitions for use in your Python Protocol API Version 2 protocols.'

export function AddLabwareCard(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const labwarePath = useSelector(getCustomLabwareDirectory)
  const addFailure = useSelector(getAddLabwareFailure)
  const handleOpenPath = (): unknown => dispatch(openCustomLabwareDirectory())
  const handleResetPath = (): unknown => dispatch(resetCustomLabwareDirectory())
  const handleChangePath = (): unknown =>
    dispatch(changeCustomLabwareDirectory())
  const handleAddLabware = (): unknown => dispatch(addCustomLabware())
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
