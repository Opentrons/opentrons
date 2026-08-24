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
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'

import { ACTIONS } from '../constants'

import type { Dispatch, ReactNode } from 'react'
import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { PositionReference } from '@opentrons/shared-data'
import type {
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface SubmergeProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function Submerge({
  onBack,
  state,
  dispatch,
  kind,
}: SubmergeProps): ReactNode {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const submergeSettings =
    kind === 'aspirate' ? state.submergeAspirate : state.submergeDispense
  const [speed, setSpeed] = useState<number | null>(
    submergeSettings?.speed ?? null
  )
  const [delayDuration, setDelayDuration] = useState<number | null>(
    submergeSettings?.delayDuration ?? null
  )
  const [position, setPosition] = useState<string | null>(
    String(submergeSettings?.position) ?? null
  )
  const positionReference =
    kind === 'aspirate'
      ? state.submergeAspirate?.positionReference
      : state.submergeDispense?.positionReference

  const action =
    kind === 'aspirate'
      ? ACTIONS.SET_SUBMERGE_ASPIRATE
      : ACTIONS.SET_SUBMERGE_DISPENSE

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
        if (speed != null && position != null && delayDuration != null) {
          dispatch({
            type: action,
            submergeSettings: {
              speed,
              delayDuration,
              position: Number(position),
              positionReference: positionReference ?? undefined,
            },
          })
          trackEventWithRobotSerial({
            name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
            properties: {
              setting: `Submerge_${kind}`,
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

  let buttonIsDisabled = false
  if (speed == null && currentStep === 1) {
    buttonIsDisabled = true
  }
  if (delayDuration == null && currentStep === 2) {
    buttonIsDisabled = true
  }
  if ((position == null || isNaN(Number(position))) && currentStep === 3) {
    buttonIsDisabled = true
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={
          kind === 'aspirate'
            ? t('submerge_before_aspirating')
            : t('submerge_before_dispensing')
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
        <SubmergeSettingComponent
          kind={kind}
          state={state}
          setSpeed={setSpeed}
          setPosition={setPosition}
          delayDuration={delayDuration}
          setDelayDuration={setDelayDuration}
          speed={speed}
          position={position}
          currentStep={currentStep}
          positionReference={positionReference}
        />
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}

interface SubmergeSettingComponentProps {
  kind: FlowRateKind
  state: QuickTransferSummaryState
  setSpeed: (speed: number | null) => void
  setPosition: (position: string | null) => void
  delayDuration: number | null
  setDelayDuration: (delayDuration: number | null) => void
  speed: number | null
  position: string | null
  currentStep: number
  positionReference?: PositionReference
}

function SubmergeSettingComponent({
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
}: SubmergeSettingComponentProps): ReactNode {
  const { t } = useTranslation(['quick_transfer'])
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

  console.log(positionRange)
  const positionError =
    position != null &&
    (Number(position) < positionRange.min ||
      Number(position) > positionRange.max)
      ? t(`value_out_of_range`, {
          min: positionRange.min,
          max: positionRange.max,
        })
      : null

  const handleSpeedChange = (userInput: string): void => {
    if (userInput === '') {
      setSpeed(null)
    } else {
      const parsedValue = Number(userInput)
      setSpeed(!isNaN(parsedValue) ? parsedValue : null)
    }
  }

  const handleDelayDurationChange = (userInput: string): void => {
    if (userInput === '') {
      setDelayDuration(null)
    } else {
      const parsedValue = Number(userInput)
      setDelayDuration(!isNaN(parsedValue) ? parsedValue : null)
    }
  }

  const handlePositionChange = (userInput: string): void => {
    if (userInput === '') {
      setPosition(null)
    } else {
      setPosition(userInput)
    }
  }

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
            {t(`submerge_${kind}_description`)}
          </StyledText>
          <TouchInputField
            autoFocus
            type="number"
            value={speed}
            label={t('speed')}
            onChange={e => {
              handleSpeedChange(e.target.value as string)
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
            initialValue={String(speed ?? '')}
            onChange={handleSpeedChange}
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
            type="number"
            value={delayDuration}
            label={t('delay_duration_s')}
            onChange={e => {
              handleDelayDurationChange(e.target.value as string)
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
            key={`${kind}_delay_duration_keyboard`}
            keyboardRef={keyboardRef}
            isDecimal
            initialValue={String(delayDuration ?? '')}
            onChange={handleDelayDurationChange}
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
            error={positionError}
            label={positionText}
            onChange={e => {
              handlePositionChange(e.target.value as string)
            }}
          />
          {positionError == null ? (
            <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
              {caption}
            </StyledText>
          ) : null}
        </Flex>
        <Flex
          paddingX={SPACING.spacing24}
          height="21.25rem"
          marginTop="7.75rem"
          borderRadius="0"
        >
          <NumericalKeyboard
            key={`${kind}_position_keyboard`}
            keyboardRef={keyboardRef}
            initialValue={String(position ?? '')}
            onChange={handlePositionChange}
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
