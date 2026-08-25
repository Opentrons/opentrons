import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_FIXED,
  RadioButton,
  SPACING,
  StyledText,
  TouchInputField,
} from '@opentrons/components'
import {
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  getTipTypeFromTipRackDefinition,
  LOW_VOLUME_PIPETTES,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'
import { SOURCE_WELL_BLOWOUT_DESTINATION } from '@opentrons/step-generation'

import { getTopPortalEl } from '/app/App/portal'
import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { i18n } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { ACTIONS } from '../constants'
import { getPipetteName } from '../utils'

import type { Dispatch, ReactNode } from 'react'
import type { CutoutConfig, SupportedTip } from '@opentrons/shared-data'
import type {
  BlowOutLocation,
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface DisposalVolumeProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export function DisposalVolume(props: DisposalVolumeProps): ReactNode {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [volume, setVolume] = useState<number | null>(null)

  const getInitialBlowoutLocation = (
    blowOut: typeof state.blowOutDispense
  ): string => {
    if (blowOut?.location == null) {
      return ''
    }
    if (typeof blowOut.location === 'string') {
      return blowOut.location
    }
    if (
      'cutoutFixtureId' in blowOut.location &&
      typeof blowOut.location.cutoutFixtureId === 'string' &&
      WASTE_CHUTE_FIXTURES.includes(blowOut.location.cutoutFixtureId)
    ) {
      return `wasteChute:${blowOut.location.cutoutId}`
    }
    if ('cutoutId' in blowOut.location) {
      return `trashBin:${blowOut.location.cutoutId}`
    }
    return ''
  }

  const [selectedBlowoutLocation, setSelectedBlowoutLocation] =
    useState<string>(getInitialBlowoutLocation(state.blowOutDispense))
  const [flowRate, setFlowRate] = useState<number | null>(null)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  // If state.dropTipLocation is dropping tips into a trash fixture, then that is the
  // only trash fixture allowed for the disposal blowout location. Otherwise (if we're
  // returning tips), let the user choose to blow out to any trash fixture on the deck.
  const selectableCutoutConfigs: CutoutConfig[] =
    typeof state.dropTipLocation === 'object'
      ? [state.dropTipLocation]
      : deckConfig.filter(
          cutoutConfig =>
            TRASH_BIN_ADAPTER_FIXTURE === cutoutConfig.cutoutFixtureId ||
            WASTE_CHUTE_FIXTURES.includes(cutoutConfig.cutoutFixtureId)
        )
  const fixtureOptions = selectableCutoutConfigs.map(cutoutConfig =>
    TRASH_BIN_ADAPTER_FIXTURE === cutoutConfig.cutoutFixtureId
      ? {
          option: cutoutConfig,
          value: `trashBin:${cutoutConfig.cutoutId}`,
          description: t('trashBin_location', {
            slotName: FLEX_SINGLE_SLOT_BY_CUTOUT_ID[cutoutConfig.cutoutId],
          }),
        }
      : {
          option: cutoutConfig,
          value: `wasteChute:${cutoutConfig.cutoutId}`,
          description: t('wasteChute_location', {
            slotName: FLEX_SINGLE_SLOT_BY_CUTOUT_ID[cutoutConfig.cutoutId],
          }),
        }
  )

  const blowoutLocationOptions = [
    ...fixtureOptions,
    {
      option: SOURCE_WELL_BLOWOUT_DESTINATION,
      value: SOURCE_WELL_BLOWOUT_DESTINATION,
      description: t('blow_out_source_well'),
    },
  ]

  const pipetteName = getPipetteName(state.pipette)
  const liquidSpecs = state.pipette.liquids
  const tipType = getTipTypeFromTipRackDefinition(state.tipRack)
  const flowRatesForSupportedTip: SupportedTip | undefined =
    state.volume < 5 &&
    `lowVolumeDefault` in liquidSpecs &&
    typeof pipetteName === 'string' &&
    LOW_VOLUME_PIPETTES.includes(pipetteName)
      ? liquidSpecs.lowVolumeDefault.supportedTips[tipType]
      : liquidSpecs.default.supportedTips[tipType]
  const minFlowRate = 0.1
  const maxFlowRate = Math.floor(
    (flowRatesForSupportedTip?.uiMaxFlowRate ?? 0) as number
  )

  const flowRateError =
    flowRate != null && (flowRate < minFlowRate || flowRate > maxFlowRate)
      ? t(`value_out_of_range`, {
          min: minFlowRate,
          max: maxFlowRate,
        })
      : null

  const handleClickBackOrExit = (): void => {
    currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (currentStep === 1) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (
        volume == null ||
        flowRate == null ||
        selectedBlowoutLocation == null
      ) {
        return
      }

      const selectedOption = blowoutLocationOptions.find(
        opt => opt.value === selectedBlowoutLocation
      )
      const blowOutLocation: BlowOutLocation =
        selectedOption?.option ?? (selectedBlowoutLocation as BlowOutLocation)

      dispatch({
        type: ACTIONS.SET_DISPOSAL_VOLUME_DISPENSE,
        disposalVolumeDispenseSettings: {
          volume,
          blowOutLocation,
          flowRate,
        },
      })
      trackEventWithRobotSerial({
        name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
        properties: {
          setting: `DisposalVolume_${kind}`,
        },
      })
      onBack()
    }
  }

  const setSaveOrContinueButtonText =
    currentStep < 3 ? t('shared:continue') : t('shared:save')

  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = volume == null
  }
  if (currentStep === 3) {
    buttonIsDisabled = flowRate == null || flowRateError != null
  }

  const handleVolumeChange = (userInput: string): void => {
    if (userInput === '') {
      setVolume(null)
    }
    const parsedVolume = parseInt(userInput)
    setVolume(!isNaN(parsedVolume) ? parsedVolume : null)
  }

  const handleFlowRateChange = (userInput: string): void => {
    if (userInput === '') {
      setFlowRate(null)
    }
    const parsedFlowRate = parseInt(userInput)
    setFlowRate(!isNaN(parsedFlowRate) ? parsedFlowRate : null)
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('disposal_volume')}
        buttonText={i18n.format(setSaveOrContinueButtonText, 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        top={SPACING.spacing8}
        buttonIsDisabled={buttonIsDisabled}
      />
      {currentStep === 1 ? (
        <Flex
          alignSelf={ALIGN_CENTER}
          gridGap={SPACING.spacing48}
          paddingX={SPACING.spacing40}
          padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40}`}
          marginTop="7.75rem" // using margin rather than justify due to content moving with error message
          alignItems={ALIGN_CENTER}
          height="22rem"
        >
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
              value={String(volume ?? '')}
              label={t('disposal_volume_µL')}
              onChange={e => {
                handleVolumeChange(e.target.value as string)
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
              keyboardRef={keyboardRef}
              initialValue={String(volume ?? '')}
              onChange={e => {
                handleVolumeChange(e)
              }}
            />
          </Flex>
        </Flex>
      ) : null}
      {currentStep === 2 ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing24}
          width="100%"
        >
          <StyledText oddStyle="level4HeaderRegular">
            {t('select_blow_out_location')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {blowoutLocationOptions.map(option => (
              <RadioButton
                key={option.value}
                isSelected={selectedBlowoutLocation === option.value}
                onChange={() => {
                  const value = String(option.value)
                  setSelectedBlowoutLocation(value)
                }}
                buttonValue={option.value}
                buttonLabel={option.description}
              />
            ))}
          </Flex>
        </Flex>
      ) : null}

      {currentStep === 3 ? (
        <Flex
          alignSelf={ALIGN_CENTER}
          gridGap={SPACING.spacing48}
          paddingX={SPACING.spacing40}
          padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40}`}
          marginTop="7.75rem" // using margin rather than justify due to content moving with error message
          alignItems={ALIGN_CENTER}
          height="22rem"
        >
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
              value={String(flowRate ?? '')}
              label={t('blowout_flow_rate_µL')}
              error={flowRateError}
              onChange={e => {
                handleFlowRateChange(e.target.value as string)
              }}
            />
            <StyledText oddStyle="bodyTextRegular" color={COLORS.grey60}>
              {t('disposal_volume_flow_rate', {
                min: minFlowRate,
                max: maxFlowRate,
              })}
            </StyledText>
          </Flex>
          <Flex
            paddingX={SPACING.spacing24}
            height="21.25rem"
            marginTop="7.75rem"
            borderRadius="0"
          >
            <NumericalKeyboard
              keyboardRef={keyboardRef}
              initialValue={String(flowRate ?? '')}
              onChange={e => {
                handleFlowRateChange(e)
              }}
            />
          </Flex>
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
