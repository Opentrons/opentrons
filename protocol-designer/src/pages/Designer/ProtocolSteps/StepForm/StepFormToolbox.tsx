import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { clsx } from 'clsx'
import get from 'lodash/get'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  Flex,
  Icon,
  POSITION_RELATIVE,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  Toolbox,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { analyticsEvent } from '/protocol-designer/analytics/actions'
import {
  FORM_ERRORS_EVENT,
  FORM_WARNINGS_EVENT,
} from '/protocol-designer/analytics/constants'
import {
  LINK_BUTTON_STYLE,
  NAV_BAR_HEIGHT_REM,
} from '/protocol-designer/components/atoms'
import { FormAlerts } from '/protocol-designer/components/organisms'
import { AdvancedSettingsUpdateConfirmationModal } from '/protocol-designer/components/organisms/AdvancedSettingsUpdateConfirmationModal'
import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'
import { RenameStepModal } from '/protocol-designer/components/organisms/RenameStepModal'
import { getFormWarningsForSelectedStep } from '/protocol-designer/dismiss/selectors'
import {
  getRobotStateTimeline,
  getRobotType,
} from '/protocol-designer/file-data/selectors'
import { stepIconsByType } from '/protocol-designer/form-types'
import { getLabwareDefsByURI } from '/protocol-designer/labware-defs/selectors'
import {
  getAdditionalEquipmentEntities,
  getCurrentFormIsPresaved,
  getDynamicFieldFormErrorsForUnsavedForm,
  getFormLevelErrorsForUnsavedForm,
  getInvariantContext,
  getModuleEntities,
  getSavedStepForms,
} from '/protocol-designer/step-forms/selectors'
import { actions } from '/protocol-designer/steplist'
import { maskField } from '/protocol-designer/steplist/fieldLevel'
import { updateFieldsForLiquidClass } from '/protocol-designer/steplist/formLevel/handleFormChange/utils'
import lineClampStyles from '/protocol-designer/styles/lineclamp.module.css'
import { getTimelineWarningsForSelectedStep } from '/protocol-designer/top-selectors/timelineWarnings'
import {
  hoverSelection,
  selectDropdownItem,
} from '/protocol-designer/ui/steps/actions/actions'

import { useAbsorbanceReaderCommandType } from './hooks'
import {
  AbsorbanceReaderTools,
  CameraTools,
  CommentTools,
  FlexStackerTools,
  HeaterShakerTools,
  MagnetTools,
  MixTools,
  MoveLabwareTools,
  MoveLiquidTools,
  PauseTools,
  TemperatureTools,
  ThermocyclerTools,
  VacuumTools,
} from './StepTools'
import {
  capitalizeFirstLetter,
  getIsErrorOnCurrentPage,
  getSaveStepSnackbarText,
  getVisibleFormErrors,
  getVisibleFormWarnings,
  makeSingleEditFieldProps,
} from './utils'

import type { ComponentType, ReactNode } from 'react'
import type { AnalyticsEvent } from '/protocol-designer/analytics/mixpanel'
import type {
  FormData,
  HydratedFormData,
  StepType,
} from '/protocol-designer/form-types'
import type { FormWarningType } from '/protocol-designer/steplist'
import type { StepFieldName } from '/protocol-designer/steplist/fieldLevel'
import type { FocusHandlers, LiquidHandlingTab, StepFormProps } from './types'

type StepFormMap = {
  [K in StepType]?: ComponentType<StepFormProps> | null
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
  camera: CameraTools,
  absorbanceReader: AbsorbanceReaderTools,
  flexStacker: FlexStackerTools,
  vacuum: VacuumTools,
}

// used to inform StepFormToolbox when to prompt user confirmation for overriding advanced settings
const FIELDS_REQUIRING_CONFIRMATION: string[] = [
  'pipette',
  'tipRack',
  'liquidClass',
  'volume',
  'path',
]

interface StepFormToolboxProps {
  canSave: boolean
  dirtyFields: string[]
  focusHandlers: FocusHandlers
  focusedField: StepFieldName | null
  formData: FormData
  hydratedForm: HydratedFormData
  handleClose: () => void
  handleSave: () => void
}

export function StepFormToolbox(props: StepFormToolboxProps): ReactNode {
  const {
    formData,
    focusHandlers,
    canSave,
    handleClose,
    handleSave,
    dirtyFields,
    focusedField,
    hydratedForm,
  } = props
  const { t, i18n } = useTranslation([
    'application',
    'shared',
    'protocol_steps',
    'tooltip',
  ])
  const dispatch = useDispatch()
  const { makeSnackbar } = useKitchen()
  const toolsComponentRef = useRef<HTMLDivElement | null>(null)
  const [analyticsStartTime] = useState<Date>(new Date())
  const [showConfirmationModal, setShowConfirmationModal] =
    useState<boolean>(false)

  const handleChangeFormInput = (name: string, value: unknown): void => {
    const maskedValue = maskField(name, value)
    dispatch(actions.changeFormInput({ update: { [name]: maskedValue } }))
  }

  const { pipetteEntities } = useSelector(getInvariantContext)
  const additionalEquipmentEntities = useSelector(
    getAdditionalEquipmentEntities
  )
  const allLabwareDefs = useSelector(getLabwareDefsByURI)
  const formWarningsForSelectedStep = useSelector(
    getFormWarningsForSelectedStep
  )
  const timelineWarningsForSelectedStep = useSelector(
    getTimelineWarningsForSelectedStep
  )
  const formLevelErrorsForUnsavedForm = useSelector(
    getFormLevelErrorsForUnsavedForm
  )
  const dynamicFormLevelErrorsForUnsavedForm = useSelector(
    getDynamicFieldFormErrorsForUnsavedForm
  ).map(error => ({
    title: error.title,
    body: error.body,
    dependentFields: error.dependentProfileFields,
    location: error.location,
  }))
  const timeline = useSelector(getRobotStateTimeline)
  const currentFormIsPresaved = useSelector(getCurrentFormIsPresaved)
  const savedStepForm = useSelector(getSavedStepForms)[formData.id]
  const robotType = useSelector(getRobotType)

  // state used to track fields that have been confirmed through the modal but before saving the step form
  const [confirmedFieldUpdates, setConfirmedFieldUpdates] = useState<
    Record<string, any>
  >({})

  const fieldsChangedRequiringConfirmation =
    FIELDS_REQUIRING_CONFIRMATION.filter(field => {
      // if field has been updated and confirmed in modal, check its most recent confirmed value
      const referenceObjectForField =
        field in confirmedFieldUpdates
          ? confirmedFieldUpdates
          : (savedStepForm ?? {})
      return formData[field] !== referenceObjectForField[field]
    })

  const moduleId = formData.moduleId
  const enableReadOrInitialization = useAbsorbanceReaderCommandType(
    moduleId as string | null
  )
  const [toolboxStep, setToolboxStep] = useState<number>(0)
  const [showFormErrors, setShowFormErrors] = useState<boolean>(false)
  const [tab, setTab] = useState<LiquidHandlingTab>('aspirate')

  // state used to determine if user has seen advanced settings page (relevant for presaved forms)
  const [hasSeenAdvancedSettings, setHasSeenAdvancedSettings] =
    useState<boolean>(false)
  useEffect(
    () => {
      if (toolboxStep === 2 && !hasSeenAdvancedSettings) {
        setHasSeenAdvancedSettings(true)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toolboxStep]
  )
  const isConfirmationRequired =
    robotType === FLEX_ROBOT_TYPE &&
    fieldsChangedRequiringConfirmation.length > 0 &&
    (!currentFormIsPresaved || hasSeenAdvancedSettings) // don't show if form is presaved and haven't reached advanced settings page yet
  const visibleFormWarnings = getVisibleFormWarnings({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: formWarningsForSelectedStep,
  })
  const visibleFormErrors = getVisibleFormErrors({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: [
      ...formLevelErrorsForUnsavedForm,
      ...dynamicFormLevelErrorsForUnsavedForm,
    ],
    page: toolboxStep,
    showErrors: !currentFormIsPresaved || showFormErrors,
  })
  const propsForFields = makeSingleEditFieldProps(
    focusHandlers,
    formData,
    handleChangeFormInput,
    hydratedForm,
    t,
    visibleFormErrors,
    showFormErrors,
    currentFormIsPresaved
  )

  const [isRename, setIsRename] = useState<boolean>(false)
  const icon = stepIconsByType[formData.stepType]

  const ToolsComponent: (typeof STEP_FORM_MAP)[keyof typeof STEP_FORM_MAP] =
    get(STEP_FORM_MAP, formData.stepType)

  const isAspirateError = formLevelErrorsForUnsavedForm.some(
    error => error.tab === 'aspirate' && error.page === toolboxStep
  )
  const isDispenseError = formLevelErrorsForUnsavedForm.some(
    error => error.tab === 'dispense' && error.page === toolboxStep
  )

  const visibleFormWarningsTypes = visibleFormWarnings.map(
    warning => warning.type
  )
  const visibleFormErrorsTypes = visibleFormErrors.map(error => error.title)

  useEffect(
    () => {
      const dispatchAnalyticsEvent = (
        eventName: string,
        eventProperties: FormWarningType[] | string[]
      ): void => {
        if (eventProperties.length > 0) {
          const event: AnalyticsEvent = {
            name: eventName,
            properties: { eventProperties },
          }
          dispatch(analyticsEvent(event))
        }
      }

      dispatchAnalyticsEvent(FORM_WARNINGS_EVENT, visibleFormWarningsTypes)
      dispatchAnalyticsEvent(FORM_ERRORS_EVENT, visibleFormErrorsTypes)
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleFormWarningsTypes, visibleFormErrorsTypes]
  )
  const moduleEntities = Object.values(useSelector(getModuleEntities))
  const stackerModules = moduleEntities.filter(moduleEntity => {
    return moduleEntity.type === FLEX_STACKER_MODULE_TYPE
  })
  const numberOfStackersLoaded: AnalyticsEvent = {
    name: 'loadFlexStacker',
    properties: {
      numberOfStackers: stackerModules.length,
    },
  }
  if (!ToolsComponent) {
    // early-exit if step form doesn't exist, this is a good check for when new steps
    // are added
    return (
      <div>
        <div>Todo: support {formData && formData.stepType} step</div>
      </div>
    )
  }

  const numStepFormPages = getStepFormNumPages(
    formData.stepType,
    enableReadOrInitialization != null
  )
  const isMultiStepToolbox =
    formData.stepType === 'absorbanceReader'
      ? enableReadOrInitialization
      : numStepFormPages > 1
  const numWarnings =
    visibleFormWarnings.length + timelineWarningsForSelectedStep.length
  const numErrors = timeline.errors?.length ?? 0

  const isErrorOnCurrentPage = getIsErrorOnCurrentPage({
    errors: formLevelErrorsForUnsavedForm,
    page: toolboxStep,
  })
  const handleUpdateLiquidClassValues = (): void => {
    updateFieldsForLiquidClass({
      propsForFields,
      rawForm: formData,
      pipetteEntities,
      additionalEquipmentEntities,
      allLabwareDefs,
      robotType,
    })
    setToolboxStep(currentStep => currentStep + strideForContinueOrBack)
    setShowConfirmationModal(false)
    handleConfirmValues()
  }
  const handleConfirmValues = (): void => {
    setConfirmedFieldUpdates(
      FIELDS_REQUIRING_CONFIRMATION.reduce((acc, field) => {
        return { ...acc, [field]: formData[field] }
      }, {})
    )
  }
  const handleScrollToTop = (): void => {
    if (toolsComponentRef.current) {
      toolsComponentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const handleSaveClick = (): void => {
    if (canSave) {
      const duration = new Date().getTime() - analyticsStartTime.getTime()
      const stepDuration: AnalyticsEvent = {
        name: 'stepDuration',
        properties: {
          stepType: formData.stepType,
          duration: `${duration / 1000} seconds`,
        },
      }
      handleSave()
      makeSnackbar(
        getSaveStepSnackbarText({
          numWarnings,
          numErrors,
          stepTypeDisplayName: i18n.format(
            t(`stepType.${formData.stepType}`),
            'titleCase'
          ),
          t,
        })
      )
      dispatch(analyticsEvent(stepDuration))
      dispatch(selectDropdownItem({ selection: null, mode: 'clear' }))
      dispatch(hoverSelection({ id: null, text: null }))
      if (stackerModules.length > 0) {
        dispatch(analyticsEvent(numberOfStackersLoaded))
      }
    } else {
      setShowFormErrors(true)
      if (tab === 'aspirate' && isDispenseError && !isAspirateError) {
        setTab('dispense')
      }
      if (tab === 'dispense' && isAspirateError && !isDispenseError) {
        setTab('aspirate')
      }
      handleScrollToTop()
    }
  }

  // For consistency and correct error rendering, we actually want the OT-2 mix/moveLiquid steps to contain 3 pages,
  // even though only 2 are shown to the user (liquid class selection omitted).
  // We will use this variable to determine the correct step stride and title page count.
  const isLiquidHandlingStepType =
    formData.stepType === 'moveLiquid' || formData.stepType === 'mix'
  const isToolboxIndexTransformNeeded =
    robotType === OT2_ROBOT_TYPE && isLiquidHandlingStepType

  const strideForContinueOrBack = isToolboxIndexTransformNeeded ? 2 : 1
  const pageIndexRequiringConfirmation = robotType === FLEX_ROBOT_TYPE ? 1 : 0

  // Require confirmation for a liquid handling step, page 1 on OT-2 or page 2 on Flex
  const isOnPageRequiringConfirmation =
    toolboxStep === pageIndexRequiringConfirmation && isLiquidHandlingStepType

  const handleContinue = (): void => {
    // Early return for confirmation modal
    if (isOnPageRequiringConfirmation && isConfirmationRequired) {
      setShowConfirmationModal(true)
      return
    }

    // Handle error cases
    if (isErrorOnCurrentPage) {
      setShowFormErrors(true)
      handleScrollToTop()
      return
    }

    // Handle page requiring confirmation (without modal)
    if (isOnPageRequiringConfirmation) {
      if (!hasSeenAdvancedSettings && currentFormIsPresaved) {
        handleUpdateLiquidClassValues()
      } else {
        setToolboxStep(currentStep => currentStep + strideForContinueOrBack)
      }
      handleScrollToTop()
      return
    }

    // Handle multi-step toolbox with more pages
    if (isMultiStepToolbox && toolboxStep < numStepFormPages - 1) {
      // need to skip past liquid class page on OT-2
      const increment =
        isLiquidHandlingStepType && toolboxStep === 0
          ? strideForContinueOrBack
          : 1
      setToolboxStep(currentStep => currentStep + increment)
      setShowFormErrors(false)
      handleScrollToTop()
      return
    }

    // Handle final page
    handleSaveClick()
  }

  const handleBack = (): void => {
    // need to skip past liquid class page on OT-2
    const increment =
      isLiquidHandlingStepType && toolboxStep === 2
        ? strideForContinueOrBack
        : 1
    setToolboxStep(currStep => currStep - increment)
    setShowFormErrors(false)
    handleScrollToTop()
  }

  const transformedStepIndexForDisplay =
    isToolboxIndexTransformNeeded && toolboxStep >= 2
      ? toolboxStep - 1
      : toolboxStep
  const transformedStepTotalForDisplay = isToolboxIndexTransformNeeded
    ? numStepFormPages - 1
    : numStepFormPages

  return (
    <>
      {showConfirmationModal && robotType === FLEX_ROBOT_TYPE ? (
        <AdvancedSettingsUpdateConfirmationModal
          formData={formData}
          fieldsChangedRequiringConfirmation={
            fieldsChangedRequiringConfirmation
          }
          onKeepExistingSettings={() => {
            setToolboxStep(toolboxStep + 1)
            setShowConfirmationModal(false)
          }}
          onConfirmUpdateSettings={handleUpdateLiquidClassValues}
          onClose={() => {
            setShowConfirmationModal(false)
          }}
        />
      ) : null}
      {isRename ? (
        <RenameStepModal
          formData={formData}
          onClose={() => {
            setIsRename(false)
          }}
        />
      ) : null}
      <Toolbox
        height="100%"
        maxHeight={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem - 2 * ${SPACING.spacing12})`}
        position={POSITION_RELATIVE}
        subHeader={
          isMultiStepToolbox ? (
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              {t('shared:part', {
                current: transformedStepIndexForDisplay + 1,
                max: transformedStepTotalForDisplay,
              })}
            </StyledText>
          ) : null
        }
        secondaryHeaderButton={
          <Btn
            onClick={() => {
              setIsRename(true)
            }}
            css={LINK_BUTTON_STYLE}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('protocol_steps:rename')}
            </StyledText>
          </Btn>
        }
        childrenPadding="0"
        onCloseClick={() => {
          handleClose()
          dispatch(
            selectDropdownItem({
              selection: null,
              mode: 'clear',
            })
          )
          dispatch(hoverSelection({ id: null, text: null }))
        }}
        closeButton={<Icon size="2rem" name="close" />}
        confirmButton={
          <Flex gridGap={SPACING.spacing8}>
            {isMultiStepToolbox && toolboxStep >= 1 ? (
              <SecondaryButton width="100%" onClick={handleBack}>
                {i18n.format(t('shared:back'), 'capitalize')}
              </SecondaryButton>
            ) : null}
            <PrimaryButton onClick={handleContinue} width="100%">
              {isMultiStepToolbox && toolboxStep < numStepFormPages - 1
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
              className={clsx(
                lineClampStyles.line_clamp,
                lineClampStyles.word_normal
              )}
              style={{ WebkitLineClamp: 2 }}
            >
              {/* TODO: use  module object from form.json instead */}
              {formData.stepType === 'flexStacker'
                ? t(`protocol_steps:${formData.stepType}`)
                : capitalizeFirstLetter(String(formData.stepName))}
            </StyledText>
          </Flex>
        }
        width="21.875rem"
      >
        <div
          ref={toolsComponentRef}
          id="stepFormTools"
          style={{ height: '100%' }}
        >
          <FormAlerts
            focusedField={focusedField}
            dirtyFields={dirtyFields}
            showFormErrors={showFormErrors}
            page={toolboxStep}
          />
          <ToolsComponent
            {...{
              formData,
              propsForFields,
              focusHandlers,
              toolboxStep,
              showFormErrors,
              focusedField,
              setShowFormErrors,
              tab,
              setTab,
            }}
          />
        </div>
      </Toolbox>
    </>
  )
}

const getStepFormNumPages = (
  stepType: StepType,
  enableReadOrInitialization: boolean
): number => {
  switch (stepType) {
    case 'mix':
    case 'moveLiquid':
      return 4
    case 'thermocycler':
      return 2
    case 'absorbanceReader':
      return enableReadOrInitialization ? 2 : 1
    default:
      return 1
  }
}
