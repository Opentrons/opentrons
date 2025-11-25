import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Divider,
  LabwareDetailsWithCount,
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
  const robotState = useSelector(getRobotStateAtActiveItem)
  const flexStackerOptions = useSelector(getFlexStackerLabwareOptions)
  console.log('flexStackerOptions:', flexStackerOptions)

  console.log('moduleId: ', moduleId)
  const { modules } = robotState ?? {}
  console.log('modules:', modules)
  console.log('moduleId: ', moduleId)
  const flexStackerModule = modules?.[moduleId]?.moduleState

  console.log('flexStackerModule:', flexStackerModule)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gridGap: SPACING.spacing8,
        width: '100%',
        paddingTop: SPACING.spacing16,
      }}
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
        value={moduleId}
      />
      <Divider marginY="0" />
      <div style={{ padding: SPACING.spacing16 }}>
        <div>
          <StyledText
            desktopStyle="bodyDefaultSemiBold"
            style={{ paddingBottom: SPACING.spacing8 }}
          >
            Stacker
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            5/6 labware filled
          </StyledText>
        </div>
        <LabwareDetailsWithCount
          title="Opentrons Flex 96 Tip Rack 1000 µL"
          subTitle="With tip rack lid"
          quantity="Quantity: 1"
        />
      </div>
      {moduleId != null ? <>test flex stacker tools</> : null}
    </div>
  )
}
