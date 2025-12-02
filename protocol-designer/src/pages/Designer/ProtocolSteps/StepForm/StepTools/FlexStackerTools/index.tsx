import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Divider,
  DropdownOption,
  Icon,
  InfoScreen,
  LabwareDetailsWithCount,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getFlexStackerLabwareOptions } from '/protocol-designer/ui/modules/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import type {
  FlexStackerModuleState,
  TimelineFrame,
} from '@opentrons/step-generation'
import type { StepFormProps } from '../../types'

export type FlexStackerToolsProps = StepFormProps & {
  robotState: TimelineFrame | null
  flexStackerOptions: DropdownOption[]
}

export function FlexStackerTools(props: FlexStackerToolsProps): JSX.Element {
  const {
    formData,
    propsForFields,
    toolboxStep,
    showFormErrors,
    robotState,
    flexStackerOptions,
  } = props
  console.log('flexStackerOptions:', flexStackerOptions)
  const { moduleId } = formData
  const dispatch = useDispatch()
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])

  const { modules } = robotState ?? {}

  const flexStackerModuleState = modules?.[moduleId]
    ?.moduleState as FlexStackerModuleState | null

  const labwareInHopperCount =
    flexStackerModuleState?.labwareInHopper?.length ?? 0
  const maxPoolCount = flexStackerModuleState?.maxPoolCount ?? 0
  const labwareOnShuttle = flexStackerModuleState?.labwareOnShuttle ?? null

  const labwareFiledComponent = (
    <div style={{ padding: SPACING.spacing16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          style={{ paddingBottom: SPACING.spacing8 }}
        >
          {t('protocol_steps:flex_stacker.stacker.label')}
        </StyledText>

        <StyledText desktopStyle="bodyDefaultRegular">
          {t('protocol_steps:flex_stacker.stacker.labware_filled', {
            amount: labwareInHopperCount,
            total: maxPoolCount,
          })}
        </StyledText>
      </div>
    </div>
  )

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
      {labwareFiledComponent}
      <Divider marginY="0" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: SPACING.spacing16,
          gridGap: SPACING.spacing8,
        }}
      >
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          style={{ paddingBottom: SPACING.spacing8 }}
        >
          Shuttle
        </StyledText>
        <div>
          <InfoScreen content="No labware on shuttle" />
        </div>
      </div>
      <Divider marginY="0" />
      <div
        style={{
          padding: SPACING.spacing16,
          display: 'flex',
          flexDirection: 'column',
          gridGap: SPACING.spacing8,
        }}
      >
        <StyledText
          desktopStyle="bodyDefaultSemiBold"
          style={{ paddingBottom: SPACING.spacing8 }}
        >
          Module controls
          <Icon name="info" size="16px" />
        </StyledText>
        <RadioButton
          buttonValue="retrieve"
          disabled={labwareInHopperCount === 0 || labwareOnShuttle != null}
          buttonLabel={
            <StyledText
              style={{ width: '100%' }}
              desktopStyle="bodyDefaultRegular"
            >
              Retrieve
            </StyledText>
          }
          buttonSubLabel={{
            align: 'vertical',
            label: 'Retrieve labware from the stacker onto the shuttle',
          }}
          onChange={() => {}}
          largeDesktopBorderRadius
        />
        <RadioButton
          buttonValue="refill"
          buttonLabel="Refill"
          buttonSubLabel={{
            align: 'vertical',
            label:
              'Refill the stacker with labware. Manually fill the stacker with more labware',
          }}
          onChange={() => {}}
          largeDesktopBorderRadius
        />
        <RadioButton
          buttonValue="empty"
          buttonLabel="Empty"
          buttonSubLabel={{
            align: 'vertical',
            label: 'Manually empty all labware from the stacker',
          }}
          onChange={() => {}}
          largeDesktopBorderRadius
        />
      </div>
    </div>
  )
}

export const FlexStackerToolsContainer = (
  props: StepFormProps
): JSX.Element => {
  const robotState = useSelector(getRobotStateAtActiveItem)
  const flexStackerOptions = useSelector(getFlexStackerLabwareOptions)

  return (
    <FlexStackerTools
      {...props}
      robotState={robotState}
      flexStackerOptions={flexStackerOptions}
    />
  )
}
