import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  DIRECTION_COLUMN,
  Divider,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import {
  ABSORBANCE_READER_INITIALIZE,
  ABSORBANCE_READER_LID,
  ABSORBANCE_READER_READ,
} from '/protocol-designer/constants'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import type { FlexStackerModuleState } from '@opentrons/step-generation'
import type { StepFormProps } from '../../types'

export function FlexStackerTools(props: StepFormProps): JSX.Element {
  const { formData, propsForFields, toolboxStep, showFormErrors } = props
  const { moduleId } = formData
  const dispatch = useDispatch()
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const isAfterMount = useRef(false)
  const robotState = useSelector(getRobotStateAtActiveItem)

  const { modules } = robotState ?? {}
  const flexStackerState = modules?.[moduleId]
    ?.moduleState as FlexStackerModuleState

  console.log('flexStackerState:', flexStackerState)

  return <Flex>test flex stacker tools</Flex>
}
