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
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getFlexStackerLabwareOptions } from '/protocol-designer/ui/modules/selectors'
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
  const flexStackerOptions = useSelector(getFlexStackerLabwareOptions)
  console.log('flexStackerOptions:', flexStackerOptions)

  const { modules } = robotState ?? {}
  const flexStackerState = modules?.[moduleId]
    ?.moduleState as FlexStackerModuleState

  console.log('flexStackerState:', flexStackerState)

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      width="100%"
    >
      <DropdownStepFormField
        options={flexStackerOptions}
        title={t('form:step_edit_form.field.absorbanceReader.moduleId.module')}
        {...propsForFields.moduleId}
        tooltipContent={null}
        onEnter={(id: string) => {
          dispatch(hoverSelection({ id, text: t('application:select') }))
        }}
        onExit={() => {
          dispatch(hoverSelection({ id: null, text: null }))
        }}
        updateValue={value => {
          console.log('value:', value)
        }}
      />
      {moduleId != null ? <>test flex stacker tools</> : null}
    </Flex>
  )
}
