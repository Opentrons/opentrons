import * as React from 'react'
import { useSelector } from 'react-redux'
import without from 'lodash/without'
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
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_LOAD_NAME,
  STANDARD_SLOT_LOAD_NAME,
} from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import { getEnableDeckModification } from '../../../feature-flags/selectors'
import { GoBack } from './GoBack'
import { HandleEnter } from './HandleEnter'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { WizardTileProps } from './types'

export function StagingAreaTile(props: WizardTileProps): JSX.Element | null {
  const { values, goBack, proceed, setFieldValue } = props
  const isOt2 = values.fields.robotType === OT2_ROBOT_TYPE
  const deckConfigurationFF = useSelector(getEnableDeckModification)
  const stagingAreaItems = values.additionalEquipment.filter(equipment =>
    equipment.includes(STAGING_AREA_LOAD_NAME)
  )

  const savedStagingAreaSlots = stagingAreaItems.flatMap(item => {
    const [loadName, fixtureLocation] = item.split('_')
    const fixtureId = `id_${fixtureLocation}`
    return [
      {
        fixtureId,
        fixtureLocation,
        loadName,
      },
    ] as DeckConfiguration
  })

  //  NOTE: fixtureId doesn't matter since we don't create
  //  the entity until you complete the create file wizard via createDeckFixture action
  //  fixtureId here is only needed to visually add to the deck configurator
  const STANDARD_EMPTY_SLOTS: DeckConfiguration = STAGING_AREA_CUTOUTS.map(
    fixtureLocation => ({
      fixtureId: `id_${fixtureLocation}`,
      fixtureLocation,
      loadName: STANDARD_SLOT_LOAD_NAME,
    })
  )

  STANDARD_EMPTY_SLOTS.forEach(emptySlot => {
    if (
      !savedStagingAreaSlots.some(
        slot => slot.fixtureLocation === emptySlot.fixtureLocation
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

  if (!deckConfigurationFF || isOt2) {
    proceed()
    return null
  }

  const handleClickAdd = (fixtureLocation: string): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.fixtureLocation === fixtureLocation) {
        return {
          ...slot,
          loadName: STAGING_AREA_LOAD_NAME,
        }
      }
      return slot
    })
    setUpdatedSlots(modifiedSlots)
    setFieldValue('additionalEquipment', [
      ...values.additionalEquipment,
      `${STAGING_AREA_LOAD_NAME}_${fixtureLocation}`,
    ])
  }

  const handleClickRemove = (fixtureLocation: string): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.fixtureLocation === fixtureLocation) {
        return {
          ...slot,
          loadName: STANDARD_SLOT_LOAD_NAME,
        }
      }
      return slot
    })
    setUpdatedSlots(modifiedSlots)
    setFieldValue(
      'additionalEquipment',
      without(
        values.additionalEquipment,
        `${STAGING_AREA_LOAD_NAME}_${fixtureLocation}`
      )
    )
  }

  return (
    <HandleEnter onEnter={proceed}>
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} height="26rem">
          <Text as="h2">
            {i18n.t('modal.create_file_wizard.staging_areas')}
          </Text>
          <DeckConfigurator
            deckConfig={updatedSlots}
            handleClickAdd={handleClickAdd}
            handleClickRemove={handleClickRemove}
          />
        </Flex>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          width="100%"
        >
          <GoBack
            onClick={() => {
              if (values.pipettesByMount.left.pipetteName === 'p1000_96') {
                goBack(3)
              } else if (values.pipettesByMount.right.pipetteName === '') {
                goBack(2)
              } else {
                goBack()
              }
            }}
          />
          <PrimaryButton onClick={() => proceed()}>
            {i18n.t('application.next')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </HandleEnter>
  )
}
