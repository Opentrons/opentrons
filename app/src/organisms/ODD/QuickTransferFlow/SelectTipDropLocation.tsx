import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  getLabwareDefURI,
  TRASH_BIN_ADAPTER_FIXTURE,
  WASTE_CHUTE_FIXTURES,
} from '@opentrons/shared-data'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { ACTIONS } from './constants'

import type { ComponentProps, Dispatch, ReactNode } from 'react'
import type { CutoutConfig } from '@opentrons/shared-data'
import type { SmallButton } from '/app/atoms/buttons'
import type {
  QuickTransferWizardAction,
  QuickTransferWizardState,
} from './types'

interface SelectTipDropLocationProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: Dispatch<QuickTransferWizardAction>
}
export function SelectTipDropLocation({
  onNext,
  onBack,
  exitButtonProps,
  state,
  dispatch,
}: SelectTipDropLocationProps): ReactNode {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []
  const [selectedTipDropLocation, setSelectedTipDropLocation] = useState<
    CutoutConfig | string | undefined
  >(undefined)

  const isTipRackReturnEnabled = state.tipRack != null && state.pipette != null

  const tipDropLocationOptions = deckConfig.filter(
    cutoutConfig =>
      WASTE_CHUTE_FIXTURES.includes(cutoutConfig.cutoutFixtureId) ||
      TRASH_BIN_ADAPTER_FIXTURE === cutoutConfig.cutoutFixtureId
  )
  if (tipDropLocationOptions.length === 0) {
    tipDropLocationOptions.push({
      cutoutId: 'cutoutA3',
      cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
    })
  }

  const handleSelectTipRack = (): void => {
    if (state.tipRack != null) {
      setSelectedTipDropLocation(getLabwareDefURI(state.tipRack))
    }
  }

  const handleClickNext = (): void => {
    dispatch({
      type: ACTIONS.SET_DROP_TIP_LOCATION,
      location: selectedTipDropLocation ?? {
        cutoutId: 'cutoutA3',
        cutoutFixtureId: TRASH_BIN_ADAPTER_FIXTURE,
      },
    })
    onNext()
  }

  return (
    <Flex>
      <ChildNavigation
        header={t('select_tip_drop_location')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        buttonIsDisabled={selectedTipDropLocation == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing8}
        width="100%"
      >
        {tipDropLocationOptions.map(option => (
          <RadioButton
            key={option.cutoutId}
            isSelected={
              selectedTipDropLocation != null &&
              typeof selectedTipDropLocation !== 'string' &&
              selectedTipDropLocation?.cutoutId === option.cutoutId
            }
            onChange={() => {
              setSelectedTipDropLocation(option)
            }}
            buttonValue={option.cutoutId}
            buttonLabel={t(
              `${
                option.cutoutFixtureId === TRASH_BIN_ADAPTER_FIXTURE
                  ? 'trashBin'
                  : 'wasteChute'
              }_location`,
              {
                slotName: FLEX_SINGLE_SLOT_BY_CUTOUT_ID[option.cutoutId],
              }
            )}
          />
        ))}
        {isTipRackReturnEnabled && state.tipRack != null ? (
          <RadioButton
            key="tiprack"
            isSelected={
              selectedTipDropLocation != null &&
              typeof selectedTipDropLocation === 'string' &&
              selectedTipDropLocation === getLabwareDefURI(state.tipRack)
            }
            buttonLabel={t('tip_rack')}
            buttonValue={getLabwareDefURI(state.tipRack)}
            onChange={handleSelectTipRack}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
