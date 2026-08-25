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
  TouchInputField,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { NumericalKeyboard } from '/app/atoms/SoftwareKeyboard'
import { i18n } from '/app/i18n'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useTrackEventWithRobotSerial } from '/app/redux-resources/analytics'
import { ANALYTICS_QUICK_TRANSFER_SETTING_SAVED } from '/app/redux/analytics'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { ACTIONS } from '../constants'
import { useBlowOutLocationOptions } from './BlowOut'

import type { Dispatch, ReactNode } from 'react'
import type {
  BlowOutLocation,
  PathOption,
  QuickTransferSummaryAction,
  QuickTransferSummaryState,
} from '../types'

interface PipettePathProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: Dispatch<QuickTransferSummaryAction>
}

export function PipettePath(props: PipettePathProps): ReactNode {
  const { onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const { trackEventWithRobotSerial } = useTrackEventWithRobotSerial()
  const keyboardRef = useRef(null)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const [selectedPath, setSelectedPath] = useState<PathOption>(state.path)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [blowOutLocation, setBlowOutLocation] = useState<
    BlowOutLocation | undefined
  >(state.blowOutDispense?.location)

  const [disposalVolume, setDisposalVolume] = useState<number | undefined>(
    state?.disposalVolumeDispenseSettings?.volume
  )
  const maxPipetteVolume = Object.values(state.pipette.liquids)[0].maxVolume
  const tipVolume = Object.values(state.tipRack.wells)[0].totalLiquidVolume

  // this is the max amount of liquid that can be held in the tip at any time
  const maxTipCapacity = Math.min(maxPipetteVolume, tipVolume)

  const allowedPipettePathOptions: Array<{
    pathOption: PathOption
    description: string
  }> = [{ pathOption: 'single', description: t('pipette_path_single') }]
  if (
    state.transferType === 'distribute' &&
    maxTipCapacity >= state.volume * 3
  ) {
    // we have the capacity for a multi dispense if we can fit at least 2x the volume per well
    // for aspiration plus 1x the volume per well for disposal volume
    allowedPipettePathOptions.push({
      pathOption: 'multiDispense',
      description: t('pipette_path_multi_dispense'),
    })
    // for multi aspirate we only need at least 2x the volume per well
  } else if (
    state.transferType === 'consolidate' &&
    maxTipCapacity >= state.volume * 2
  ) {
    allowedPipettePathOptions.push({
      pathOption: 'multiAspirate',
      description: t('pipette_path_multi_aspirate'),
    })
  }

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
      if (selectedPath !== 'multiDispense') {
        dispatch({
          type: ACTIONS.SET_PIPETTE_PATH,
          path: selectedPath,
        })
        trackEventWithRobotSerial({
          name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
          properties: {
            setting: `PipettePath`,
          },
        })
        onBack()
      } else {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else {
      dispatch({
        type: ACTIONS.SET_PIPETTE_PATH,
        path: selectedPath as PathOption,
      })
      trackEventWithRobotSerial({
        name: ANALYTICS_QUICK_TRANSFER_SETTING_SAVED,
        properties: {
          setting: `PipettePath`,
        },
      })
      onBack()
    }
  }

  const saveOrContinueButtonText =
    selectedPath === 'multiDispense' && currentStep < 3
      ? t('shared:continue')
      : t('shared:save')

  const maxDisposalCapacity = maxTipCapacity - state.volume * 2
  const volumeRange = { min: 1, max: maxDisposalCapacity }

  const volumeError =
    disposalVolume != null &&
    (disposalVolume < volumeRange.min || disposalVolume > volumeRange.max)
      ? t(`value_out_of_range`, {
          min: volumeRange.min,
          max: volumeRange.max,
        })
      : null

  let buttonIsDisabled = false
  if (currentStep === 2) {
    buttonIsDisabled = disposalVolume == null || volumeError != null
  } else if (currentStep === 3) {
    buttonIsDisabled = blowOutLocation == null
  }

  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('pipette_path')}
        buttonText={i18n.format(saveOrContinueButtonText, 'capitalize')}
        onClickBack={handleClickBackOrExit}
        onClickButton={handleClickSaveOrContinue}
        buttonIsDisabled={buttonIsDisabled}
      />
      {currentStep === 1 ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing4}
          width="100%"
        >
          {allowedPipettePathOptions.map(option => (
            <RadioButton
              key={option.description}
              isSelected={selectedPath === option.pathOption}
              onChange={() => {
                setSelectedPath(option.pathOption)
              }}
              buttonValue={option.description}
              buttonLabel={option.description}
              radioButtonType="large"
            />
          ))}
        </Flex>
      ) : null}
      {currentStep === 2 ? (
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
              type="number"
              value={disposalVolume}
              label={t('disposal_volume_µL')}
              error={volumeError}
              onChange={e => {
                setDisposalVolume(Number(e.target.value))
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
              initialValue={String(disposalVolume ?? '')}
              onChange={e => {
                setDisposalVolume(Number(e))
              }}
            />
          </Flex>
        </Flex>
      ) : null}
      {currentStep === 3 ? (
        <Flex
          marginTop={SPACING.spacing120}
          flexDirection={DIRECTION_COLUMN}
          padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
          gridGap={SPACING.spacing4}
          width="100%"
        >
          {blowOutLocationItems.map(option => (
            <RadioButton
              key={option.description}
              isSelected={
                isEqual(blowOutLocation, option.location) ||
                blowOutLocation === option.location
              }
              onChange={() => {
                setBlowOutLocation(option.location)
              }}
              buttonValue={option.description}
              buttonLabel={option.description}
              radioButtonType="large"
            />
          ))}
        </Flex>
      ) : null}
    </Flex>,
    getTopPortalEl()
  )
}
