import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  SPACING,
  StyledText,
  TouchInputField,
} from '@opentrons/components'
import { POSITION_REFERENCE_TOP } from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { parseNumericalInput } from '/app/organisms/ODD/utils/parseNumericalInput'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'

import { ACTIONS } from '../constants'

import type { Dispatch } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { PositionReference } from '@opentrons/shared-data'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface RetractProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function Retract({
  onBack,
  state,
  dispatch,
  kind,
}: RetractProps): JSX.Element {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const retractSettings =
    kind === 'aspirate' ? state.retractAspirate : state.retractDispense
  const [speed, setSpeed] = useState<string>(
    retractSettings?.speed != null ? String(retractSettings.speed) : ''
  )
  const [delayDuration, setDelayDuration] = useState<string>(
    retractSettings?.delayDuration != null
      ? String(retractSettings.delayDuration)
      : ''
  )
  const [position, setPosition] = useState<string>(
    retractSettings?.position != null ? String(retractSettings.position) : ''
  )
  const positionReference =
    kind === 'aspirate'
      ? state.retractAspirate?.positionReference
      : state.retractDispense?.positionReference

  const action =
    kind === 'aspirate'
      ? ACTIONS.SET_RETRACT_ASPIRATE
      : ACTIONS.SET_RETRACT_DISPENSE

  const handleClickBackOrExit = (): void => {
    currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    switch (currentStep) {
      case 1:
        setCurrentStep(2)
        break
      case 2:
        setCurrentStep(3)
        break
      case 3:
        if (
          parsedSpeed.result === 'success' &&
          parsedPosition.result === 'success' &&
          parsedDelayDuration.result === 'success'
        ) {
          dispatch({
            type: action,
            retractSettings: {
              speed: parsedSpeed.data,
              delayDuration: parsedDelayDuration.data,
              position: parsedPosition.data,
              positionReference: positionReference ?? undefined,
            },
          })
          trackEventWithRobotSerial({
            name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
            properties: {
              setting: `Retract_${kind}`,
            },
          })
          onBack()
        }
        break
    }
  }

  const setSaveOrContinueButtonText =
    currentStep === 1 || currentStep === 2
      ? t('shared:continue')
      : t('shared:save')

  const parsedSpeed = parseNumericalInput(speed, {
    allowDecimal: true,
    allowNegative: false,
  })
  const parsedDelayDuration = parseNumericalInput(delayDuration, {
    allowDecimal: true,
    allowNegative: false,
  })
  let wellHeight = 1
  if (
    kind === 'aspirate' &&
    state.sourceWells != null &&
    state.sourceWells.length > 0
  ) {
    wellHeight = Math.max(
      ...state.sourceWells.map(well =>
        state.source != null ? state.source.wells[well].depth : 0
      )
    )
  } else if (
    kind === 'dispense' &&
    state.destinationWells != null &&
    state.destinationWells.length > 0
  ) {
    const destLabwareDefinition =
      state.destination === 'source' ? state.source : state.destination
    wellHeight = Math.max(
      ...state.destinationWells.map(well =>
        destLabwareDefinition != null
          ? destLabwareDefinition.wells[well].depth
          : 0
      )
    )
  }
  const positionRange =
    positionReference === POSITION_REFERENCE_TOP
      ? { min: -wellHeight, max: 2 }
      : { min: 0, max: wellHeight + 2 }
  const parsedPosition = parseNumericalInput(position, {
    allowDecimal: false,
    allowNegative: positionReference === POSITION_REFERENCE_TOP,
    min: positionRange.min,
    max: positionRange.max,
  })

  let buttonIsDisabled = false
  if (currentStep === 1) {
    buttonIsDisabled = parsedSpeed.result !== 'success'
  }
  if (currentStep === 2) {
    buttonIsDisabled = parsedDelayDuration.result !== 'success'
  }
  if (currentStep === 3) {
    buttonIsDisabled = parsedPosition.result !== 'success'
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={
          kind === 'aspirate'
            ? t('retract_after_aspirating')
            : t('retract_after_dispensing')
        }
        buttonText={i18n.format(setSaveOrContinueButtonText, 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        top={SPACING.spacing8}
        buttonIsDisabled={buttonIsDisabled}
      />
      <Flex
        alignSelf={ALIGN_CENTER}
        gridGap={SPACING.spacing48}
        paddingX={SPACING.spacing40}
        padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40}`}
        marginTop="7.75rem" // using margin rather than justify due to content moving with error message
        alignItems={ALIGN_CENTER}
        height="22rem"
      >
        <RetractSettingComponent
          kind={kind}
          state={state}
          speed={speed}
          setSpeed={setSpeed}
          delayDuration={delayDuration}
          setDelayDuration={setDelayDuration}
          position={position}
          setPosition={setPosition}
          currentStep={currentStep}
          positionReference={positionReference}
        />
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}

interface RetractSettingComponentProps {
  kind: FlowRateKind
  state: QuickTransferSummaryState
  setSpeed: (speed: string) => void
  setPosition: (position: string) => void
  delayDuration: string
  setDelayDuration: (delayDuration: string) => void
  speed: string
  position: string
  currentStep: number
  positionReference?: PositionReference
}

function RetractSettingComponent({
  kind,
  state,
  speed,
  setSpeed,
  delayDuration,
  setDelayDuration,
  position,
  setPosition,
  currentStep,
  positionReference,
}: RetractSettingComponentProps): JSX.Element {
  const { t } = useTranslation('quick_transfer')
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)

  // TODO: accommodate arbitrary position reference
  const positionText =
    positionReference === POSITION_REFERENCE_TOP
      ? t('distance_top_of_well_mm')
      : t('distance_bottom_of_well_mm')

  let wellHeight = 1
  if (
    kind === 'aspirate' &&
    state.sourceWells != null &&
    state.sourceWells.length > 0
  ) {
    wellHeight = Math.max(
      ...state.sourceWells.map(well =>
        state.source != null ? state.source.wells[well].depth : 0
      )
    )
  } else if (
    kind === 'dispense' &&
    state.destinationWells != null &&
    state.destinationWells.length > 0
  ) {
    const destLabwareDefinition =
      state.destination === 'source' ? state.source : state.destination
    wellHeight = Math.max(
      ...state.destinationWells.map(well =>
        destLabwareDefinition != null
          ? destLabwareDefinition.wells[well].depth
          : 0
      )
    )
  }
  const positionRange =
    positionReference === POSITION_REFERENCE_TOP
      ? {
          min: -wellHeight,
          max: 2,
        }
      : {
          min: 0,
          max: wellHeight + 2,
        }
  const parsedPosition = parseNumericalInput(position, {
    allowDecimal: false,
    allowNegative: positionReference === POSITION_REFERENCE_TOP,
    min: positionRange.min,
    max: positionRange.max,
  })
  const positionErrorMessage =
    parsedPosition.result === 'rangeError'
      ? t('value_out_of_range', {
          min: parsedPosition.min,
          max: parsedPosition.max,
        })
      : parsedPosition.result === 'syntaxError'
        ? t('enter_a_valid_number')
        : null
  const parsedSpeed = parseNumericalInput(speed, {
    allowDecimal: true,
    allowNegative: false,
  })
  const speedErrorMessage =
    parsedSpeed.result === 'syntaxError' ? t('enter_a_valid_number') : null
  const parsedDelayDuration = parseNumericalInput(delayDuration, {
    allowDecimal: true,
    allowNegative: false,
  })
  const delayDurationErrorMessage =
    parsedDelayDuration.result === 'syntaxError'
      ? t('enter_a_valid_number')
      : null

  const speedSetting = (): JSX.Element => {
    return (
      <>
        <Flex
          width="30.5rem"
          height="100%"
          gridGap={SPACING.spacing24}
          flexDirection={DIRECTION_COLUMN}
          marginTop={SPACING.spacing68}
        >
          <StyledText oddStyle="level4HeaderRegular">
            {kind === 'aspirate'
              ? t('withdraw_tip_from_liquid_aspirate')
              : t('withdraw_tip_from_liquid_dispense')}
          </StyledText>
          <TouchInputField
            autoFocus
            type="text"
            value={speed}
            label={t('speed')}
            error={speedErrorMessage}
            onChange={e => {
              setSpeed(e.target.value)
            }}
          />
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
          borderRadius="0"
        >
          <NumericalKeyboard
            key={`${kind}_speed_keyboard`}
            keyboardRef={keyboardRef}
            isDecimal
            initialValue={speed}
            onChange={setSpeed}
          />
        </Flex>
      </>
    )
  }

  const delayDurationSetting = (): JSX.Element => {
    return (
      <>
        <Flex
          width="30.5rem"
          height="100%"
          gridGap={SPACING.spacing24}
          flexDirection={DIRECTION_COLUMN}
          marginTop={SPACING.spacing68}
        >
          <TouchInputField
            autoFocus
            type="text"
            value={delayDuration}
            label={t('delay_duration_s')}
            error={delayDurationErrorMessage}
            onChange={e => {
              setDelayDuration(e.target.value)
            }}
          />
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
        >
          <NumericalKeyboard
            key={`${kind}_delay_duration_keyboard`}
            keyboardRef={keyboardRef}
            isDecimal
            initialValue={delayDuration}
            onChange={setDelayDuration}
          />
        </Flex>
      </>
    )
  }

  const positionSetting = (): JSX.Element => {
    const caption =
      positionReference === POSITION_REFERENCE_TOP
        ? t('from_top', { min: -wellHeight })
        : t('from_bottom', { max: wellHeight + 2 })
    return (
      <>
        <Flex
          width="30.5rem"
          height="100%"
          gridGap={SPACING.spacing8}
          flexDirection={DIRECTION_COLUMN}
          marginTop={SPACING.spacing68}
        >
          <TouchInputField
            autoFocus
            type="text"
            value={position}
            error={positionErrorMessage}
            label={positionText}
            onChange={e => {
              setPosition(e.target.value)
            }}
          />
          {positionErrorMessage == null ? (
            <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
              {caption}
            </StyledText>
          ) : null}
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
        >
          <NumericalKeyboard
            key={`${kind}_position_keyboard`}
            keyboardRef={keyboardRef}
            initialValue={position}
            onChange={setPosition}
            hasHyphen={positionReference === POSITION_REFERENCE_TOP}
          />
        </Flex>
      </>
    )
  }

  switch (currentStep) {
    case 1:
      return speedSetting()
    case 2:
      return delayDurationSetting()
    case 3:
      return positionSetting()
    default:
      console.error('step not found')
      return speedSetting()
  }
}
