import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  TouchInputField,
} from '@opentrons/components'

import {
  isValidNumericalInput,
  StatelessNumericalKeyboard,
} from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { ACTIONS, CONSOLIDATE, DISTRIBUTE } from './constants'
import { getVolumeRange } from './utils'

import type { ComponentProps, Dispatch } from 'react'
import type { SmallButton } from '/app/atoms/buttons'
import type {
  QuickTransferWizardAction,
  QuickTransferWizardState,
} from './types'

interface VolumeEntryProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: Dispatch<QuickTransferWizardAction>
}

export function VolumeEntry(props: VolumeEntryProps): JSX.Element {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const [volume, setVolume] = useState<string>(
    state.volume ? state.volume.toString() : ''
  )
  const volumeRange = getVolumeRange(state)
  let headerCopy = t('set_transfer_volume')
  let textEntryCopy = t('volume_per_well_µL')
  if (state.transferType === CONSOLIDATE) {
    headerCopy = t('set_aspirate_volume')
    textEntryCopy = t('aspirate_volume_µL')
  } else if (state.transferType === DISTRIBUTE) {
    headerCopy = t('set_dispense_volume')
    textEntryCopy = t('dispense_volume_µL')
  }

  const volumeAsNumber = volume !== '' ? Number(volume) : null

  const handleVolumeChange = (input: string): void => {
    const isValidInput = isValidNumericalInput(input, { allowDecimal: true })
    if (isValidInput === false) {
      return
    }
    setVolume(input)
  }

  const handleClickNext = (): void => {
    // the button will be disabled if this values is null
    if (volumeAsNumber != null && !Number.isNaN(volumeAsNumber)) {
      dispatch({
        type: ACTIONS.SET_VOLUME,
        volume: volumeAsNumber,
      })
      onNext()
    }
  }
  let error = null
  if (volumeRange.min > volumeRange.max) {
    error =
      state.transferType === 'consolidate'
        ? t('consolidate_volume_error')
        : t('distribute_volume_error')
  } else if (
    volume !== '' &&
    (Number.isNaN(volumeAsNumber) ||
      (volumeAsNumber != null && volumeAsNumber < volumeRange.min) ||
      (volumeAsNumber != null && volumeAsNumber > volumeRange.max))
  ) {
    error = t(`value_out_of_range`, {
      min: volumeRange.min,
      max: volumeRange.max,
    })
  }

  return (
    <Flex>
      <ChildNavigation
        header={headerCopy}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        buttonIsDisabled={error != null || volume === ''}
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
            value={volume}
            label={textEntryCopy}
            error={error}
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
          <StatelessNumericalKeyboard
            value={volume}
            isDecimal
            onChange={handleVolumeChange}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
