// @flow
import type { Options } from '@opentrons/components'
import * as React from 'react'
import { connect } from 'react-redux'

import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { BaseState } from '../../../types'
import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import type { FocusHandlers } from '../types'
import type { StepFormDropdownProps } from './StepFormDropdownField'
import { StepFormDropdown } from './StepFormDropdownField'

type OP = {|
  ...$Exact<FocusHandlers>,
  name: StepFieldName,
  className?: string,
|}

type SP = {| options: Options |}

const mapSTP = (state: BaseState): SP => ({
  options: uiLabwareSelectors.getLabwareOptions(state),
})

export const LabwareField: React.AbstractComponent<OP> = connect<
  StepFormDropdownProps,
  OP,
  SP,
  _,
  _,
  _
>(mapSTP)(StepFormDropdown)
