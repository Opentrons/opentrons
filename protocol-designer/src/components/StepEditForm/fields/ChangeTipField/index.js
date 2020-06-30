// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getWellRatio } from '../../../../steplist/utils'

import type { BaseState } from '../../../../types'
import type { FormData } from '../../../../form-types'
import type { ChangeTipOptions } from '../../../../step-generation/types'
import { ChangeTip } from './ChangeTip'

type Props = React.ElementProps<typeof ChangeTip>
type OP = {| name: $PropertyType<Props, 'name'> |}
type SP = $Diff<$Exact<Props>, OP>

const ALL_CHANGE_TIP_VALUES: Array<ChangeTipOptions> = [
  'always',
  'once',
  'perSource',
  'perDest',
  'never',
]

function getDisabledChangeTipOptions(
  rawForm: FormData
): ?Set<ChangeTipOptions> {
  switch (rawForm.stepType) {
    case 'moveLiquid': {
      const path = rawForm.path
      const wellRatio = getWellRatio(
        rawForm.aspirate_wells,
        rawForm.dispense_wells
      )
      // form with no wells selected treated as 'single'
      if (!wellRatio || !path || path === 'single') {
        if (wellRatio === '1:many') {
          return new Set(['perSource'])
        }
        return new Set(['perDest'])
      }
      // path is multi
      return new Set(['perSource', 'perDest'])
    }
    case 'mix': {
      return new Set(['perSource', 'perDest'])
    }
    default: {
      console.warn(
        `getChangeTipOptions for stepType ${rawForm.stepType} not yet implemented!`
      )
      return null
    }
  }
}

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const rawForm = stepFormSelectors.getUnsavedForm(state)

  return {
    options: ALL_CHANGE_TIP_VALUES, // TODO Ian 2019-01-28 these may vary for different step types
    disabledOptions: rawForm ? getDisabledChangeTipOptions(rawForm) : null,
  }
}

export const ChangeTipField: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  _,
  _,
  _
>(mapSTP)(ChangeTip)
