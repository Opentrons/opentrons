// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { Path } from './Path'
import { i18n } from '../../../../localization'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getWellRatio } from '../../../../steplist/utils'
import { volumeInCapacityForMulti } from '../../../../steplist/formLevel/handleFormChange/utils'

import type { PipetteEntities } from '../../../../step-forms'
import type { FormData, PathOption } from '../../../../form-types'
import type { BaseState } from '../../../../types'

type Props = React.ElementProps<typeof Path>
type SP = {| disabledPathMap: $PropertyType<Props, 'disabledPathMap'> |}
type OP = $Diff<$Exact<Props>, SP>

function getDisabledPathMap(
  rawForm: ?FormData,
  pipetteEntities: PipetteEntities
): ?{ [PathOption]: string } {
  if (!rawForm || !rawForm.pipette) return null

  const withinCapacityForMultiPath = volumeInCapacityForMulti(
    rawForm,
    pipetteEntities
  )
  const wellRatio = getWellRatio(rawForm.aspirate_wells, rawForm.dispense_wells)
  const changeTip = rawForm.changeTip

  let disabledPathMap = {}

  // changeTip is lowest priority disable reasoning
  if (changeTip === 'perDest') {
    disabledPathMap = {
      ...disabledPathMap,
      multiDispense: i18n.t(
        'form.step_edit_form.field.path.subtitle.incompatible_with_per_dest'
      ),
    }
  } else if (changeTip === 'perSource') {
    disabledPathMap = {
      ...disabledPathMap,
      multiAspirate: i18n.t(
        'form.step_edit_form.field.path.subtitle.incompatible_with_per_source'
      ),
    }
  }

  // transfer volume overwrites change tip disable reasoning
  if (!withinCapacityForMultiPath) {
    disabledPathMap = {
      ...disabledPathMap,
      multiAspirate: i18n.t(
        'form.step_edit_form.field.path.subtitle.volume_too_high'
      ),
      multiDispense: i18n.t(
        'form.step_edit_form.field.path.subtitle.volume_too_high'
      ),
    }
  }

  // wellRatio overwrites all other disable reasoning
  if (wellRatio === '1:many') {
    disabledPathMap = {
      ...disabledPathMap,
      multiAspirate: i18n.t(
        'form.step_edit_form.field.path.subtitle.only_many_to_1'
      ),
    }
  } else if (wellRatio === 'many:1') {
    disabledPathMap = {
      ...disabledPathMap,
      multiDispense: i18n.t(
        'form.step_edit_form.field.path.subtitle.only_1_to_many'
      ),
    }
  } else {
    disabledPathMap = {
      ...disabledPathMap,
      multiAspirate: i18n.t(
        'form.step_edit_form.field.path.subtitle.only_many_to_1'
      ),
      multiDispense: i18n.t(
        'form.step_edit_form.field.path.subtitle.only_1_to_many'
      ),
    }
  }

  return disabledPathMap
}

function mapSTP(state: BaseState): SP {
  const rawForm = stepFormSelectors.getUnsavedForm(state)
  const pipetteEntities = stepFormSelectors.getPipetteEntities(state)
  const disabledPathMap = getDisabledPathMap(rawForm, pipetteEntities)
  return {
    disabledPathMap,
  }
}

export const PathField: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  _,
  _,
  _
>(mapSTP)(Path)
