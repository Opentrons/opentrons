// @flow
import { connect } from 'react-redux'

import { selectors as uiLabwareSelectors } from '../../../ui/labware'
import { StepFormDropdown } from './StepFormDropdown'
import type { Options } from '@opentrons/components'
import type { StepFieldName } from '../../../steplist/fieldLevel'
import type { BaseState } from '../../../types'
import type { FocusHandlers } from '../types'
import type { StepFormDropdownProps } from './StepFormDropdown'

type OP = {|
  ...$Exact<FocusHandlers>,
  name: StepFieldName,
  className?: string,
|}

type SP = {| options: Options |}

const mapSTP = (state: BaseState): SP => ({
  options: uiLabwareSelectors.getLabwareOptions(state),
})

export const LabwareField = connect<StepFormDropdownProps, OP, SP, _, _, _>(
  mapSTP
)(StepFormDropdown)
