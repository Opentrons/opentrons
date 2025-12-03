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
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <StyledText desktopStyle="bodyDefaultSemiBold">
        {t('protocol_steps:flex_stacker.stacker.label')}
      </StyledText>

      {labwareInHopperCount > 0 ? (
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('protocol_steps:flex_stacker.stacker.labware_filled', {
            amount: labwareInHopperCount,
            total: maxPoolCount,
          })}
        </StyledText>
      ) : null}
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
      <Divider margin="0" marginY="0" />
      <div
        style={{
          padding: `0 ${SPACING.spacing16}`,
          gap: SPACING.spacing8,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {labwareFiledComponent}
        {flexStackerModuleState?.storedLabwareDetails != null ? (
          <LabwareDetailsWithCount
            title={
              flexStackerModuleState.storedLabwareDetails.primaryLabware
                .loadName
            }
            subTitle={
              flexStackerModuleState.storedLabwareDetails.lidLabware?.loadName
            }
            quantity={t('protocol_steps:flex_stacker.stacker.quantity', {
              count:
                flexStackerModuleState.storedLabwareDetails.initialCount?.toString() ??
                '0',
            })}
          />
        ) : (
          <InfoScreen
            content={t('protocol_steps:flex_stacker.stacker.no_labware')}
          />
        )}
      </div>
      <Divider margin="0" marginY="0" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: `0 ${SPACING.spacing16}`,
          gridGap: SPACING.spacing8,
        }}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('protocol_steps:flex_stacker.shuttle.label')}
        </StyledText>
        <div>
          {labwareOnShuttle != null &&
          flexStackerModuleState?.storedLabwareDetails != null ? (
            <LabwareDetailsWithCount
              title={
                flexStackerModuleState.storedLabwareDetails?.primaryLabware
                  .loadName
              }
              subTitle={
                flexStackerModuleState.storedLabwareDetails?.lidLabwareId
                  ?.loadName
              }
              quantity={null}
            />
          ) : (
            <InfoScreen
              content={t('protocol_steps:flex_stacker.shuttle.no_labware')}
            />
          )}
        </div>
      </div>
      <Divider margin="0" marginY="0" />
      <div
        style={{
          padding: `0 ${SPACING.spacing16}`,
          display: 'flex',
          flexDirection: 'column',
          gridGap: SPACING.spacing8,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '40%',
          }}
        >
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t('protocol_steps:flex_stacker.module_controls.label')}
          </StyledText>
          <Icon name="info" size="16px" />
        </div>
        <RadioButton
          buttonValue="retrieve"
          disabled={labwareInHopperCount === 0 || labwareOnShuttle != null}
          buttonLabel={
            <StyledText desktopStyle="bodyDefaultRegular">Retrieve</StyledText>
          }
          buttonSubLabel={{
            align: 'vertical',
            label: t(
              'protocol_steps:flex_stacker.module_controls.retrieve_sublabel'
            ),
          }}
          onChange={() => {}}
          largeDesktopBorderRadius
        />
        <RadioButton
          buttonValue="refill"
          buttonLabel={t(
            'protocol_steps:flex_stacker.module_controls.refill_label'
          )}
          buttonSubLabel={{
            align: 'vertical',
            label: t(
              'protocol_steps:flex_stacker.module_controls.refill_sublabel'
            ),
          }}
          onChange={e => {
            console.log('e:', e)
          }}
          largeDesktopBorderRadius
        />
        <RadioButton
          buttonValue="empty"
          buttonLabel={t(
            'protocol_steps:flex_stacker.module_controls.empty_label'
          )}
          buttonSubLabel={{
            align: 'vertical',
            label: t(
              'protocol_steps:flex_stacker.module_controls.empty_sublabel'
            ),
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
