import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  Flex,
  Box,
  SPACING,
  DIRECTION_COLUMN,
  POSITION_FIXED,
  COLORS,
} from '@opentrons/components'
import {
  WASTE_CHUTE_FIXTURES,
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'
import { getTopPortalEl } from '../../../App/portal'
import { LargeButton } from '../../../atoms/buttons'
import { ChildNavigation } from '../../ChildNavigation'
import { useNotifyDeckConfigurationQuery } from '../../../resources/deck_configuration'

import type {
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
} from '../types'

interface TipDropLocationProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function TipDropLocation(props: TipDropLocationProps): JSX.Element {
  const { onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const tipDropLocationOptions = deckConfig.reduce<
    {
      type: 'wasteChute' | 'trashBin'
      location: string
    }[]
  >((acc, configCutout) => {
    if (WASTE_CHUTE_FIXTURES.includes(configCutout.cutoutFixtureId)) {
      acc.push({
        type: 'wasteChute',
        location: FLEX_SINGLE_SLOT_BY_CUTOUT_ID[configCutout.cutoutId],
      })
    } else if (TRASH_BIN_ADAPTER_FIXTURE === configCutout.cutoutFixtureId) {
      acc.push({
        type: 'trashBin',
        location: FLEX_SINGLE_SLOT_BY_CUTOUT_ID[configCutout.cutoutId],
      })
    }

    return acc
  }, [])

  const [
    selectedTipDropLocation,
    setSelectedTipDropLocation,
  ] = React.useState<string>(state.dropTipLocation)

  const handleClickSave = (): void => {
    if (selectedTipDropLocation !== state.dropTipLocation) {
      dispatch({
        type: 'SET_DROP_TIP_LOCATION',
        location: selectedTipDropLocation,
      })
    }
    onBack()
  }
  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('tip_drop_location')}
        buttonText={t('save')}
        onClickBack={onBack}
        onClickButton={handleClickSave}
        buttonIsDisabled={selectedTipDropLocation == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        {tipDropLocationOptions.map(option => (
          <LargeButton
            key={option.type}
            buttonType={
              selectedTipDropLocation === option.type ? 'primary' : 'secondary'
            }
            onClick={() => {
              setSelectedTipDropLocation(option.type)
            }}
            buttonText={t(`${option.type}_location`, {
              location: option.location,
            })}
          />
        ))}
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
