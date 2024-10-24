import { useState } from 'react'
import get from 'lodash/get'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  POSITION_RELATIVE,
  PrimaryButton,
  SPACING,
  SecondaryButton,
  StyledText,
  TYPOGRAPHY,
  Toolbox,
} from '@opentrons/components'
import { stepIconsByType } from '../../../../form-types'
import { FormAlerts } from '../../../../organisms'
import { useKitchen } from '../../../../organisms/Kitchen/hooks'
import { RenameStepModal } from '../../../../organisms/RenameStepModal'
import { getFormWarningsForSelectedStep } from '../../../../dismiss/selectors'
import { getTimelineWarningsForSelectedStep } from '../../../../top-selectors/timelineWarnings'
import { getRobotStateTimeline } from '../../../../file-data/selectors'
import { BUTTON_LINK_STYLE, LINE_CLAMP_TEXT_STYLE } from '../../../../atoms'
import {
  CommentTools,
  HeaterShakerTools,
  MagnetTools,
  MixTools,
  MoveLabwareTools,
  MoveLiquidTools,
  PauseTools,
  TemperatureTools,
  ThermocyclerTools,
} from './StepTools'
import {
  getSaveStepSnackbarText,
  getVisibleFormErrors,
  getVisibleFormWarnings,
  capitalizeFirstLetter,
} from './utils'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FormData, StepType } from '../../../../form-types'
import type { FieldPropsByName, FocusHandlers, StepFormProps } from './types'
import { getFormLevelErrorsForUnsavedForm } from '../../../../step-forms/selectors'

type StepFormMap = {
  [K in StepType]?: React.ComponentType<StepFormProps> | null
}

const STEP_FORM_MAP: StepFormMap = {
  mix: MixTools,
  pause: PauseTools,
  moveLabware: MoveLabwareTools,
  moveLiquid: MoveLiquidTools,
  magnet: MagnetTools,
  temperature: TemperatureTools,
  thermocycler: ThermocyclerTools,
  heaterShaker: HeaterShakerTools,
  comment: CommentTools,
}

interface StepFormToolboxProps {
  canSave: boolean
  dirtyFields: string[]
  focusHandlers: FocusHandlers
  focusedField: StepFieldName | null
  formData: FormData
  propsForFields: FieldPropsByName
  handleClose: () => void
  handleSave: () => void
}

export function StepFormToolbox(props: StepFormToolboxProps): JSX.Element {
  const {
    formData,
    focusHandlers,
    canSave,
    handleClose,
    handleSave,
    propsForFields,
    dirtyFields,
    focusedField,
  } = props
  const { t, i18n } = useTranslation([
    'application',
    'shared',
    'protocol_steps',
  ])
  const { makeSnackbar } = useKitchen()
  const formWarningsForSelectedStep = useSelector(
    getFormWarningsForSelectedStep
  )
  const timelineWarningsForSelectedStep = useSelector(
    getTimelineWarningsForSelectedStep
  )
  const formLevelErrorsForUnsavedForm = useSelector(
    getFormLevelErrorsForUnsavedForm
  )
  const timeline = useSelector(getRobotStateTimeline)
  const [toolboxStep, setToolboxStep] = useState<number>(
    // progress to step 2 if thermocycler form is populated
    formData.thermocyclerFormType === 'thermocyclerProfile' ||
      formData.thermocyclerFormType === 'thermocyclerState'
      ? 1
      : 0
  )
  const [
    showFormErrorsAndWarnings,
    setShowFormErrorsAndWarnings,
  ] = useState<boolean>(false)
  const visibleFormWarnings = getVisibleFormWarnings({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: formWarningsForSelectedStep,
  })
  const visibleFormErrors = getVisibleFormErrors({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: formLevelErrorsForUnsavedForm,
  })
  const [isRename, setIsRename] = useState<boolean>(false)
  const icon = stepIconsByType[formData.stepType]

  const ToolsComponent: typeof STEP_FORM_MAP[keyof typeof STEP_FORM_MAP] = get(
    STEP_FORM_MAP,
    formData.stepType
  )

  if (!ToolsComponent) {
    // early-exit if step form doesn't exist, this is a good check for when new steps
    // are added
    return (
      <div>
        <div>Todo: support {formData && formData.stepType} step</div>
      </div>
    )
  }

  const isMultiStepToolbox =
    formData.stepType === 'moveLiquid' ||
    formData.stepType === 'mix' ||
    formData.stepType === 'thermocycler'
  const numWarnings =
    visibleFormWarnings.length + timelineWarningsForSelectedStep.length
  const numErrors = timeline.errors?.length ?? 0

  const handleSaveClick = (): void => {
    if (canSave) {
      handleSave()
      makeSnackbar(
        getSaveStepSnackbarText({
          numWarnings,
          numErrors,
          stepTypeDisplayName: i18n.format(
            t(`stepType.${formData.stepType}`),
            'capitalize'
          ),
          t,
        }) as string
      )
    } else {
      setShowFormErrorsAndWarnings(true)
    }
  }

  return (
    <>
      {isRename ? (
        <RenameStepModal
          formData={formData}
          onClose={() => {
            setIsRename(false)
          }}
        />
      ) : null}
      <Toolbox
        position={POSITION_RELATIVE}
        subHeader={
          isMultiStepToolbox ? (
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              {t('shared:step', { current: toolboxStep + 1, max: 2 })}
            </StyledText>
          ) : null
        }
        secondaryHeaderButton={
          <Btn
            onClick={() => {
              setIsRename(true)
            }}
            css={BUTTON_LINK_STYLE}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('protocol_steps:rename')}
            </StyledText>
          </Btn>
        }
        childrenPadding="0"
        onCloseClick={handleClose}
        closeButton={<Icon size="2rem" name="close" />}
        confirmButton={
          <Flex gridGap={SPACING.spacing8}>
            {isMultiStepToolbox && toolboxStep === 1 ? (
              <SecondaryButton
                width="100%"
                onClick={() => {
                  setToolboxStep(0)
                }}
              >
                {i18n.format(t('shared:back'), 'capitalize')}
              </SecondaryButton>
            ) : null}
            <PrimaryButton
              onClick={
                isMultiStepToolbox && toolboxStep === 0
                  ? () => {
                      setToolboxStep(1)
                    }
                  : handleSaveClick
              }
              width="100%"
            >
              {isMultiStepToolbox && toolboxStep === 0
                ? i18n.format(t('shared:continue'), 'capitalize')
                : t('shared:save')}
            </PrimaryButton>
          </Flex>
        }
        title={
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <Icon size="1rem" name={icon} minWidth="1rem" />
            <StyledText
              desktopStyle="bodyLargeSemiBold"
              css={`
                ${LINE_CLAMP_TEXT_STYLE(2)}
                word-break: break-all
              `}
            >
              {capitalizeFirstLetter(String(formData.stepName))}
            </StyledText>
          </Flex>
        }
      >
        {showFormErrorsAndWarnings ? (
          <FormAlerts focusedField={focusedField} dirtyFields={dirtyFields} />
        ) : null}
        <ToolsComponent
          {...{
            formData,
            propsForFields,
            focusHandlers,
            toolboxStep,
            visibleFormErrors,
          }}
        />
      </Toolbox>
    </>
  )
}
