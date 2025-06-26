import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  POSITION_FIXED,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
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

import type { Dispatch } from 'react'
import type { SupportedTip } from '@opentrons/shared-data'
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

export function DisposalVolume(props: DisposalVolumeProps): JSX.Element {
  const { kind, onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [volume, setVolume] = useState<number | null>(null)

  const getInitialBlowoutLocation = (blowOut: typeof state.blowOut): string => {
    if (blowOut == null) {
      return ''
    }
    if (typeof blowOut === 'string') {
      return blowOut
    }
    return `trashBin:${blowOut.cutoutId}`
  }

  const [
    selectedBlowoutLocation,
    setSelectedBlowoutLocation,
  ] = useState<string>(getInitialBlowoutLocation(state.blowOut))
  const [flowRate, setFlowRate] = useState<number | null>(null)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const fixtureLocationOptions = deckConfig.filter(
    cutoutConfig =>
      WASTE_CHUTE_FIXTURES.includes(cutoutConfig.cutoutFixtureId) ||
      TRASH_BIN_ADAPTER_FIXTURE === cutoutConfig.cutoutFixtureId
  )

  const trashBinCutoutId = fixtureLocationOptions.find(
    option => option.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
  )?.cutoutId

  const trashBinOption: BlowOutLocation | undefined =
    trashBinCutoutId != null
      ? {
          cutoutId: trashBinCutoutId,
          cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
        }
      : undefined

  const blowoutLocationOptions = [
    ...(trashBinOption != null
      ? [
          {
            option: trashBinOption,
            value: `trashBin:${trashBinOption.cutoutId}`,
            description: t('trashBin'),
          },
        ]
      : []),
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
    LOW_VOLUME_PIPETTES.includes(pipetteName)
      ? liquidSpecs.lowVolumeDefault.supportedTips[tipType]
      : liquidSpecs.default.supportedTips[tipType]
  const minFlowRate = 1
  const maxFlowRate = Math.floor(flowRatesForSupportedTip?.uiMaxFlowRate ?? 0)

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

      dispatch({
        type: ACTIONS.SET_DISPOSAL_VOLUME_DISPENSE,
        disposalVolumeDispenseSettings: {
          volume,
          blowOutLocation: selectedBlowoutLocation as BlowOutLocation,
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

  // ToDo Add flowRate range

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
            <InputField
              type="text"
              value={String(volume ?? '')}
              title={t('disposal_volume_µL')}
              readOnly
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
                  setSelectedBlowoutLocation(option.value)
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
            <InputField
              type="text"
              value={String(flowRate ?? '')}
              title={t('blowout_flow_rate_µL')}
              error={flowRateError}
              readOnly
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
