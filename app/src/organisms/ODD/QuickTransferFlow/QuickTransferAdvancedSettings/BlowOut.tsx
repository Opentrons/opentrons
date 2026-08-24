import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import isEqual from 'lodash/isEqual'

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
  FLEX_ROBOT_TYPE,
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  getAllLiquidClassDefs,
  getFlexNameConversion,
  getTipTypeFromTipRackDefinition,
  linearInterpolate,
  LOW_VOLUME_PIPETTES,
  NONE_LIQUID_CLASS_NAME,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'
import { getTransferPlanAndReferenceVolumes } from '@opentrons/step-generation'

import { getTopPortalEl } from '/app/App/portal'
import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { i18n } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { ACTIONS } from '../constants'
import { getMaxUiFlowRate, getPipetteName } from '../utils'
import { getExtractTiprackTypeFromURI } from '../utils/getExtractTiprackTypeFromURI'

import type { Dispatch, ReactNode } from 'react'
import type {
  CutoutConfig,
  DeckConfiguration,
  SupportedTip,
} from '@opentrons/shared-data'
import type {
  BlowOutLocation,
  FlowRateKind,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
  TransferType,
} from '../types'

interface BlowOutProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
  kind: FlowRateKind
}

export const useBlowOutLocationOptions = (
  deckConfig: DeckConfiguration,
  transferType: TransferType,
  dropTipLocation: CutoutConfig | string
): Array<{ location: BlowOutLocation; description: string }> => {
  const { t } = useTranslation('quick_transfer')

  const trashLocations = deckConfig.filter(
    cutoutConfig =>
      WASTE_CHUTE_FIXTURES.includes(cutoutConfig.cutoutFixtureId) ||
      TRASH_BIN_ADAPTER_FIXTURE === cutoutConfig.cutoutFixtureId
  )
  // add trash bin in A3 if no trash or waste chute configured
  if (trashLocations.length === 0) {
    trashLocations.push({
      cutoutId: 'cutoutA3',
      cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    })
  }
  // if the user picked a trash fixture for tip drop, then filter the list of
  // trashLocations to only allow them to blow out to the same trash fixture:
  if (typeof dropTipLocation === 'object') {
    trashLocations.splice(0, trashLocations.length, dropTipLocation)
  }

  const blowOutLocationItems: Array<{
    location: BlowOutLocation
    description: string
  }> = []
  if (transferType !== 'distribute') {
    blowOutLocationItems.push({
      location: 'dest_well',
      description: t('blow_out_destination_well'),
    })
  }
  if (transferType !== 'consolidate') {
    blowOutLocationItems.push({
      location: 'source_well',
      description: t('blow_out_source_well'),
    })
  }
  trashLocations.forEach(location => {
    blowOutLocationItems.push({
      location,
      description:
        location.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
          ? t('trashBin_location', {
              slotName: FLEX_SINGLE_SLOT_BY_CUTOUT_ID[location.cutoutId],
            })
          : t('wasteChute_location', {
              slotName: FLEX_SINGLE_SLOT_BY_CUTOUT_ID[location.cutoutId],
            }),
    })
  })
  return blowOutLocationItems
}

export function BlowOut(props: BlowOutProps): ReactNode {
  const { onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const keyboardRef = useRef(null)
  const [isBlowOutEnabled, setIsBlowOutEnabled] = useState<boolean>(
    state.blowOutDispense != null
  )
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [blowOutLocation, setBlowOutLocation] = useState<
    BlowOutLocation | undefined
  >(state.blowOutDispense?.location ?? undefined)
  const [speed, setSpeed] = useState<number | null>(
    state.blowOutDispense?.flowRate! ?? null
  )
  const enableBlowOutDisplayItems = [
    {
      option: true,
      description: t('option_enabled'),
      onClick: () => {
        setIsBlowOutEnabled(true)
      },
    },
    {
      option: false,
      description: t('option_disabled'),
      onClick: () => {
        setIsBlowOutEnabled(false)
      },
    },
  ]
  const blowOutLocationItems = useBlowOutLocationOptions(
    deckConfig,
    state.transferType,
    state.dropTipLocation
  )
  const handleClickBackOrExit = (): void => {
    currentStep > 1 ? setCurrentStep(currentStep - 1) : onBack()
  }

  const handleClickSaveOrContinue = (): void => {
    if (currentStep === 1) {
      if (!isBlowOutEnabled) {
        dispatch({
          type: ACTIONS.SET_BLOW_OUT,
          blowOutSettings: {
            location: undefined,
            flowRate: 0,
          },
        })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `BlowOut`,
          },
        })
        onBack()
      } else {
        setCurrentStep(currentStep + 1)
      }
    } else if (currentStep === 2) {
      if (blowOutLocation != null) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      dispatch({
        type: ACTIONS.SET_BLOW_OUT,
        blowOutSettings: {
          location: blowOutLocation,
          flowRate: speed ?? 1,
        },
      })
      trackEventWithRobotSerial({
        name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
        properties: {
          setting: `BlowOut`,
        },
      })
      onBack()
    }
  }

  const saveOrContinueButtonText =
    isBlowOutEnabled && currentStep < 3
      ? t('shared:continue')
      : t('shared:save')

  let buttonIsDisabled = false
  if (currentStep === 3) {
    buttonIsDisabled = blowOutLocation == null
  }

  const pipetteName = getPipetteName(state.pipette)
  const liquidSpecs = state.pipette.liquids
  const tipType = getTipTypeFromTipRackDefinition(state.tipRack)
  const flowRatesForSupportedTip: SupportedTip | undefined =
    state.volume < 5 &&
    `lowVolumeDefault` in liquidSpecs &&
    LOW_VOLUME_PIPETTES.includes(pipetteName as string)
      ? liquidSpecs.lowVolumeDefault.supportedTips[tipType]
      : liquidSpecs.default.supportedTips[tipType]

  const allLiquidClassDefs = getAllLiquidClassDefs()

  const selectedLiquidClass = state.liquidClassName
  const liquidClassDef =
    allLiquidClassDefs[selectedLiquidClass ?? NONE_LIQUID_CLASS_NAME]
  const convertedPipetteName =
    state.pipette != null ? getFlexNameConversion(state.pipette) : null

  const minFlowRate = 1
  const { loadName: currentTiprackLoadName } = state.tipRack.parameters

  const tipTypeSettings = liquidClassDef?.byPipette
    ?.find(({ pipetteModel }) => convertedPipetteName === pipetteModel)
    ?.byTipType.find(tipObject => {
      const tiprackLoadName = tipObject.tiprack.split('/')[1]
      return tiprackLoadName === currentTiprackLoadName
    })

  const correctionByVolume = tipTypeSettings?.singleDispense?.correctionByVolume
  const retract = tipTypeSettings?.singleDispense?.retract

  const referenceVolumesForByVolumeInterpolation =
    getTransferPlanAndReferenceVolumes({
      pipetteSpecs: state.pipette,
      volume: state.volume,
      tiprackDefinition: state.tipRack,
      path: state.path,
      numAspirateWells: state.sourceWells.length,
      numDispenseWells: state.destinationWells.length,
      aspirateAirGapByVolume:
        (retract?.airGapByVolume as Array<[number, number]>) ?? [],
      conditioningByVolume:
        (correctionByVolume as Array<[number, number]>) ?? null,
      disposalByVolume: null, // note always null because blowout is available only for single dispense
    })

  const [referenceVolumeFlowRate, referenceVolumeCorrection] = [
    referenceVolumesForByVolumeInterpolation.referenceVolumes?.flowRate
      .dispense,
    referenceVolumesForByVolumeInterpolation.referenceVolumes?.correction
      .dispense,
  ]

  const liquidClassValuesForPipette = liquidClassDef?.byPipette?.find(
    ({ pipetteModel }) => convertedPipetteName === pipetteModel
  )
  const liquidClassValuesForTip = getExtractTiprackTypeFromURI(
    liquidClassValuesForPipette,
    currentTiprackLoadName
  )

  const correctionVolume =
    referenceVolumeCorrection != null &&
    (liquidClassValuesForTip?.singleDispense?.correctionByVolume?.length ?? 0) >
      0
      ? linearInterpolate(
          referenceVolumeCorrection,
          liquidClassValuesForTip?.singleDispense?.correctionByVolume as Array<
            [number, number]
          >
        )
      : 0

  const maxFlowRate = getMaxUiFlowRate({
    targetVolume: referenceVolumeFlowRate,
    channels: state.pipette.channels,
    tipLiquidSpecs: flowRatesForSupportedTip,
    flowRateType: 'blowout',
    correctionVolume: correctionVolume ?? 0,
    shaftULperMM: state.pipette.shaftULperMM,
    robotType: FLEX_ROBOT_TYPE,
  })

  const speedError =
    speed != null && (speed < minFlowRate || speed > maxFlowRate)
      ? t(`value_out_of_range`, {
          min: minFlowRate,
          max: maxFlowRate,
        })
      : null

  const handleFlowRateChange = (userInput: string): void => {
    if (userInput === '') {
      setSpeed(null)
    }
    const parsedFlowRate = parseInt(userInput)
    setSpeed(!isNaN(parsedFlowRate) ? parsedFlowRate : null)
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('blow_out_after_dispensing')}
        buttonText={i18n.format(saveOrContinueButtonText, 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        top={SPACING.spacing8}
        buttonIsDisabled={buttonIsDisabled}
      />
      {currentStep === 1 ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing24}
          width="100%"
        >
          <StyledText oddStyle="level4HeaderRegular">
            {t('blow_out_description')}
          </StyledText>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            {enableBlowOutDisplayItems.map(displayItem => (
              <RadioButton
                key={displayItem.description}
                isSelected={isBlowOutEnabled === displayItem.option}
                onChange={displayItem.onClick}
                buttonValue={displayItem.description}
                buttonLabel={displayItem.description}
                radioButtonType="large"
              />
            ))}
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
            {blowOutLocationItems.map(blowOutLocationItem => (
              <RadioButton
                key={blowOutLocationItem.description}
                isSelected={
                  isEqual(blowOutLocation, blowOutLocationItem.location) ||
                  blowOutLocation === blowOutLocationItem.location
                }
                onChange={() => {
                  setBlowOutLocation(
                    blowOutLocationItem.location as BlowOutLocation
                  )
                }}
                buttonValue={blowOutLocationItem.description}
                buttonLabel={blowOutLocationItem.description}
                radioButtonType="large"
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
              value={String(speed ?? '')}
              label={t('blow_out_speed')}
              error={speedError}
              onChange={e => {
                handleFlowRateChange(e.target.value as string)
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
              initialValue={String(speed ?? '')}
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
