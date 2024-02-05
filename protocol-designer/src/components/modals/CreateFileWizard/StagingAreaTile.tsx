import * as React from 'react'
import without from 'lodash/without'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  Text,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  PrimaryButton,
  DeckConfigurator,
} from '@opentrons/components'
import {
  OT2_ROBOT_TYPE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'
import { GoBack } from './GoBack'
import { HandleEnter } from './HandleEnter'

import type { DeckConfiguration, CutoutId } from '@opentrons/shared-data'
import type { AdditionalEquipment, WizardTileProps } from './types'

export function StagingAreaTile(props: WizardTileProps): JSX.Element | null {
  const { getValues, goBack, proceed, setValue, watch } = props
  const { t } = useTranslation(['modal', 'application'])
  const { fields, pipettesByMount } = getValues()
  const additionalEquipment = watch('additionalEquipment')
  const isOt2 = fields.robotType === OT2_ROBOT_TYPE
  const stagingAreaItems = additionalEquipment.filter(equipment =>
    // TODO(bc, 11/14/2023): refactor the additional items field to include a cutoutId
    // and a cutoutFixtureId so that we don't have to string parse here to generate them
    equipment.includes('stagingArea')
  )

  const savedStagingAreaSlots: DeckConfiguration = stagingAreaItems.flatMap(
    item => {
      // TODO(bc, 11/14/2023): refactor the additional items field to include a cutoutId
      // and a cutoutFixtureId so that we don't have to string parse here to generate them
      const cutoutId = item.split('_')[1] as CutoutId
      return [
        {
          cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
          cutoutId,
        },
      ]
    }
  )

  const STANDARD_EMPTY_SLOTS: DeckConfiguration = STAGING_AREA_CUTOUTS.map(
    cutoutId => ({
      cutoutId,
      cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
    })
  )

  STANDARD_EMPTY_SLOTS.forEach(emptySlot => {
    if (
      !savedStagingAreaSlots.some(
        ({ cutoutId }) => cutoutId === emptySlot.cutoutId
      )
    ) {
      savedStagingAreaSlots.push(emptySlot)
    }
  })

  const initialSlots =
    stagingAreaItems.length > 0 ? savedStagingAreaSlots : STANDARD_EMPTY_SLOTS

  const [updatedSlots, setUpdatedSlots] = React.useState<DeckConfiguration>(
    initialSlots
  )

  if (isOt2) {
    proceed()
    return null
  }

  const handleClickAdd = (cutoutId: string): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.cutoutId === cutoutId) {
        return {
          ...slot,
          cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
        }
      }
      return slot
    })
    setUpdatedSlots(modifiedSlots)
    setValue('additionalEquipment', [
      ...additionalEquipment,
      `stagingArea_${cutoutId}` as AdditionalEquipment,
    ])
  }

  const handleClickRemove = (cutoutId: string): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.cutoutId === cutoutId) {
        return {
          ...slot,
          cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
        }
      }
      return slot
    })
    setUpdatedSlots(modifiedSlots)
    setValue(
      'additionalEquipment',
      without(
        additionalEquipment,
        `stagingArea_${cutoutId}` as AdditionalEquipment
      )
    )
  }

  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} height="26rem">
          <Text as="h2">{t('staging_areas')}</Text>
          <DeckConfigurator
            deckConfig={updatedSlots}
            handleClickAdd={handleClickAdd}
            handleClickRemove={handleClickRemove}
            showExpansion={false}
          />
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
        >
          <GoBack
            onClick={() => {
              if (pipettesByMount.left.pipetteName === 'p1000_96') {
                goBack(3)
              } else if (pipettesByMount.right.pipetteName === '') {
                goBack(2)
              } else {
                goBack()
              }
            }}
          />
          <PrimaryButton onClick={() => proceed()}>
            {t('application:next')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}
