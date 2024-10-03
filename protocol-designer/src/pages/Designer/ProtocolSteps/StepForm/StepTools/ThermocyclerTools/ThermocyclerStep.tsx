import { css } from 'styled-components'
import { useState } from 'react'
import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  InputField,
  JUSTIFY_SPACE_BETWEEN,
  NO_WRAP,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import {
  temperatureRangeFieldValue,
  isTimeFormatMinutesSeconds,
} from '../../../../../../steplist/fieldLevel/errors'
import {
  maskToFloat,
  maskToTime,
} from '../../../../../../steplist/fieldLevel/processing'
import { uuid } from '../../../../../../utils'
import { getTimeFromString, getStepIndex } from './utils'

export interface ThermocyclerStepType {
  durationMinutes: string
  durationSeconds: string
  id: string
  temperature: string
  title: string
  type: 'profileStep'
}

interface ThermocyclerStepProps {
  steps: ThermocyclerStepType[]
  setSteps: React.Dispatch<React.SetStateAction<any[]>>
  setShowCreateNewStep: (_: boolean) => void
  step?: ThermocyclerStepType
  backgroundColor?: string
  showHeader?: boolean
  readOnly?: boolean
}
export function ThermocyclerStep(props: ThermocyclerStepProps): JSX.Element {
  const {
    setShowCreateNewStep,
    step,
    steps,
    setSteps,
    backgroundColor = COLORS.grey30,
    showHeader = true,
    readOnly = true,
  } = props
  const { i18n, t } = useTranslation(['application', 'form'])
  const [hover, setHover] = useState<boolean>(false)
  const [showEdit, setShowEditCurrentStep] = useState<boolean>(!readOnly)
  const [stepState, setStepState] = useState({
    name: { value: step?.title, error: null },
    temp: { value: step?.temperature, error: null },
    time: {
      value:
        step?.durationMinutes != null && step?.durationSeconds != null
          ? `${step.durationMinutes}:${step.durationSeconds}`
          : undefined,
      error: null,
    },
  })
  const id = step?.id ?? null
  const isStepStateError =
    Object.values(stepState).some(({ error }) => error != null) ||
    Object.values(stepState).some(({ value }) => value == null || value === '')

  const handleDeleteStep = (): void => {
    if (id != null) {
      setSteps(
        steps.filter((s: any) => {
          return s.id !== id
        })
      )
    } else {
      setShowCreateNewStep(false)
    }
  }
  const handleValueUpdate = (
    field: 'name' | 'temp' | 'time',
    value: string,
    errorCheck?: (value: any) => string | null
  ): void => {
    setStepState({
      ...stepState,
      [field]: {
        value,
        error: errorCheck?.(value) ?? null,
      },
    })
  }
  const handleSaveStep = (): void => {
    const stepId = uuid()
    const { minutes, seconds } = getTimeFromString(stepState.time.value ?? '')
    const stepBaseData = {
      durationMinutes: minutes,
      durationSeconds: seconds,
      id: stepId,
      temperature: stepState.temp.value,
      title: stepState.name.value,
      type: 'profileStep',
    }

    const existingStepIndex = steps.findIndex(step => step.id === id)
    if (existingStepIndex >= 0) {
      // editing a step already in steps
      setSteps([
        ...steps.slice(0, existingStepIndex),
        { ...stepBaseData, id },
        ...steps.slice(existingStepIndex + 1),
      ])
    } else {
      setSteps([...steps, { ...stepBaseData, id: stepId }])
    }
    setShowCreateNewStep(false)
    setShowEditCurrentStep(false)
  }

  const header = showEdit ? (
    <Flex
      padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      width="100%"
    >
      <Flex gridGap={SPACING.spacing24} alignItems={ALIGN_CENTER}>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          borderRadius={BORDERS.borderRadius4}
          backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
          padding={`${SPACING.spacing2} ${SPACING.spacing8}`}
        >
          {id != null ? getStepIndex(steps, id) : steps.length + 1}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {i18n.format(
            t('form:step_edit_form.field.thermocyclerProfile.step'),
            'capitalize'
          )}
        </StyledText>
      </Flex>
      <Flex gridGap={SPACING.spacing8}>
        <Btn
          onClick={handleDeleteStep}
          whiteSpace={NO_WRAP}
          textDecoration={TYPOGRAPHY.textDecorationUnderline}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {i18n.format(
              t('form:step_edit_form.field.thermocyclerProfile.delete'),
              'capitalize'
            )}
          </StyledText>
        </Btn>
        <PrimaryButton onClick={handleSaveStep} disabled={isStepStateError}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {i18n.format(t('save'), 'capitalize')}
          </StyledText>
        </PrimaryButton>
      </Flex>
    </Flex>
  ) : (
    <Flex
      padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      width="100%"
      backgroundColor={backgroundColor}
      borderRadius={BORDERS.borderRadius4}
      onMouseEnter={() => {
        setHover(true)
      }}
      onMouseLeave={() => {
        setHover(false)
      }}
    >
      <Flex gridGap={SPACING.spacing24} alignItems={ALIGN_CENTER}>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          borderRadius={BORDERS.borderRadius4}
          backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
          padding={`${SPACING.spacing2} ${SPACING.spacing8}`}
        >
          {getStepIndex(steps, id ?? '')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular">
          {[
            stepState.name.value,
            `${stepState.temp.value}${t('units.degrees')}`,
            `${stepState.time.value}`,
          ].join(', ')}
        </StyledText>
      </Flex>
      <Flex gridGap={SPACING.spacing8}>
        {hover ? (
          <Btn
            whiteSpace={NO_WRAP}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
            onClick={() => {
              setShowEditCurrentStep(true)
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {i18n.format(t('edit'), 'capitalize')}
            </StyledText>
          </Btn>
        ) : null}
        <Flex
          css={css`
            &:hover {
              background-color: ${COLORS.grey40};
            }
          `}
          borderRadius={BORDERS.borderRadius4}
          cursor={CURSOR_POINTER}
          onClick={handleDeleteStep}
        >
          <Icon name="close" size="1.5rem" />
        </Flex>
      </Flex>
    </Flex>
  )
  const editContent = (
    <Flex
      padding={`${SPACING.spacing12} ${SPACING.spacing16}`}
      gridGap={SPACING.spacing24}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="33%"
      >
        <InputField
          title={i18n.format(
            t('form:step_edit_form.field.thermocyclerProfile.name'),
            'capitalize'
          )}
          value={stepState.name.value}
          onChange={(e: React.ChangeEvent<any>) => {
            handleValueUpdate('name', e.target.value as string)
          }}
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="33%"
      >
        <InputField
          title={i18n.format(
            t('form:step_edit_form.field.thermocyclerState.block.temperature'),
            'capitalize'
          )}
          units={t('units.degrees')}
          value={stepState.temp.value}
          onChange={(e: React.ChangeEvent<any>) => {
            handleValueUpdate(
              'temp',
              maskToFloat(e.target.value),
              temperatureRangeFieldValue(4, 96)
            )
          }}
          error={stepState.temp.error}
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="33%"
      >
        <InputField
          title={i18n.format(
            t('form:step_edit_form.field.thermocyclerProfile.time'),
            'capitalize'
          )}
          units={t('units.time')}
          value={stepState.time.value}
          onChange={(e: React.ChangeEvent<any>) => {
            handleValueUpdate(
              'time',
              maskToTime(e.target.value),
              isTimeFormatMinutesSeconds
            )
          }}
          error={stepState.time.error}
        />
      </Flex>
    </Flex>
  )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      backgroundColor={backgroundColor}
      borderRadius={BORDERS.borderRadius4}
    >
      {showHeader ? header : null}
      {showEdit ? editContent : null}
    </Flex>
  )
}
