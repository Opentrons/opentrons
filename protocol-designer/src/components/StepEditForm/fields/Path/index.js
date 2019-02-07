// @flow
import {connect} from 'react-redux'
import Path from './Path'
import {selectors as stepFormSelectors} from '../../../../step-forms'
import {getWellRatio} from '../../../../steplist/utils'
import {getPipetteCapacity} from '../../../../pipettes/pipetteData'
import type {ElementProps} from 'react'
import type {PipetteEntities} from '../../../../step-forms'
import type {FormData, PathOption} from '../../../../form-types'
import type {BaseState} from '../../../../types'

type Props = ElementProps<typeof Path>
type SP = {disabledPaths: $PropertyType<Props, 'disabledPaths'>}

function getDisabledPaths (
  rawForm: ?FormData,
  pipetteEntities: PipetteEntities
): ?Set<PathOption> {
  if (!rawForm) return null

  const pipetteCapacity = rawForm.pipette && getPipetteCapacity(pipetteEntities[rawForm.pipette])
  // NOTE: ensuring that disposalVolume_volume will not exceed pipette capacity is responsibility of dependentFieldsUpdateMoveLiquid
  const withinCapacityForMultiPath = (
    rawForm.volume > 0 &&
    pipetteCapacity > 0 &&
    rawForm.volume * 2 <= pipetteCapacity
  )
  const wellRatio = getWellRatio(rawForm.aspirate_wells, rawForm.dispense_wells)

  if (withinCapacityForMultiPath) {
    if (wellRatio === '1:many') return new Set(['multiAspirate'])
    if (wellRatio === 'many:1') return new Set(['multiDispense'])
  }

  // no valid well ratio, or n:n, or any ratio when exceeding capacity
  return new Set(['multiAspirate', 'multiDispense'])
}

function mapSTP (state: BaseState): SP {
  const rawForm = stepFormSelectors.getUnsavedForm(state)
  const pipetteEntities = stepFormSelectors.getPipetteEntities(state)
  const disabledPaths = getDisabledPaths(rawForm, pipetteEntities)
  return {
    disabledPaths,
  }
}

export default connect(mapSTP)(Path)
