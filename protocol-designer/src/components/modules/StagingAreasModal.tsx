import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Formik, useFormikContext } from 'formik'
import {
  BUTTON_TYPE_SUBMIT,
  OutlineButton,
  ModalShell,
  Flex,
  SPACING,
  DIRECTION_ROW,
  Box,
  Text,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_END,
  DeckConfigurator,
} from '@opentrons/components'
import {
  CutoutId,
  DeckConfiguration,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_CUTOUTS,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'
import { getStagingAreaSlots } from '../../utils'
import { i18n } from '../../localization'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../step-forms/actions/additionalItems'
import { getSlotIsEmpty } from '../../step-forms'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { PDAlert } from '../alerts/PDAlert'
import type { AdditionalEquipmentEntity } from '@opentrons/step-generation'

export interface StagingAreasValues {
  selectedSlots: string[]
}

const StagingAreasModalComponent = (
  props: StagingAreasModalProps
): JSX.Element => {
  const { onCloseClick, stagingAreas } = props
  const { values, setFieldValue } = useFormikContext<StagingAreasValues>()
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const areSlotsEmpty = values.selectedSlots.map(slot =>
    getSlotIsEmpty(initialDeckSetup, slot)
  )
  const hasWasteChute =
    Object.values(initialDeckSetup.additionalEquipmentOnDeck).find(
      aE => aE.name === 'wasteChute'
    ) != null
  const hasConflictedSlot =
    hasWasteChute && values.selectedSlots.find(slot => slot === 'cutoutD3')
      ? false
      : areSlotsEmpty.includes(false)

  const mappedStagingAreas: DeckConfiguration = stagingAreas.flatMap(area => {
    return area.location != null
      ? [
          {
            cutoutId: area.location as CutoutId,
            cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
          },
        ]
      : []
  })
  const STANDARD_EMPTY_SLOTS: DeckConfiguration = STAGING_AREA_CUTOUTS.map(
    cutoutId => ({
      cutoutId,
      cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
    })
  )

  STANDARD_EMPTY_SLOTS.forEach(emptySlot => {
    if (
      !mappedStagingAreas.some(
        ({ cutoutId }) => cutoutId === emptySlot.cutoutId
      )
    ) {
      mappedStagingAreas.push(emptySlot)
    }
  })

  const selectableSlots =
    mappedStagingAreas.length > 0 ? mappedStagingAreas : STANDARD_EMPTY_SLOTS
  const [updatedSlots, setUpdatedSlots] = React.useState<DeckConfiguration>(
    selectableSlots
  )

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
    const updatedSelectedSlots = [...values.selectedSlots, cutoutId]
    setFieldValue('selectedSlots', updatedSelectedSlots)
  }

  const handleClickRemove = (cutoutId: string): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.cutoutId === cutoutId) {
        return { ...slot, cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE }
      }
      return slot
    })
    setUpdatedSlots(modifiedSlots)
    setFieldValue(
      'selectedSlots',
      values.selectedSlots.filter(item => item !== cutoutId)
    )
  }

  return (
    <Form>
      <Box paddingX={SPACING.spacing32}>
        <Flex
          justifyContent={JUSTIFY_END}
          alignItems={ALIGN_CENTER}
          height="3.125rem"
        >
          <Box>
            {hasConflictedSlot ? (
              <PDAlert
                alertType="warning"
                title={i18n.t(
                  'alert.deck_config_placement.SLOT_OCCUPIED.staging_area'
                )}
                description={''}
              />
            ) : null}
          </Box>
        </Flex>

        <Flex
          height="20rem"
          marginTop="-2.5rem"
          justifyContent={JUSTIFY_CENTER}
        >
          <DeckConfigurator
            deckConfig={updatedSlots}
            handleClickAdd={handleClickAdd}
            handleClickRemove={handleClickRemove}
          />
        </Flex>
      </Box>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_FLEX_END}
        paddingTop="4rem"
        paddingRight={SPACING.spacing32}
        paddingBottom={SPACING.spacing32}
        gridGap={SPACING.spacing8}
      >
        <OutlineButton onClick={onCloseClick}>
          {i18n.t('button.cancel')}
        </OutlineButton>
        <OutlineButton type={BUTTON_TYPE_SUBMIT} disabled={hasConflictedSlot}>
          {i18n.t('button.save')}
        </OutlineButton>
      </Flex>
    </Form>
  )
}

export interface StagingAreasModalProps {
  onCloseClick: () => void
  stagingAreas: AdditionalEquipmentEntity[]
}

export const StagingAreasModal = (
  props: StagingAreasModalProps
): JSX.Element => {
  const { onCloseClick, stagingAreas } = props
  const dispatch = useDispatch()
  const stagingAreaLocations = getStagingAreaSlots(stagingAreas)

  const onSaveClick = (values: StagingAreasValues): void => {
    onCloseClick()

    values.selectedSlots.forEach(slot => {
      if (!stagingAreaLocations?.includes(slot)) {
        dispatch(createDeckFixture('stagingArea', slot))
      }
    })
    Object.values(stagingAreas).forEach(area => {
      if (!values.selectedSlots.includes(area.location as string)) {
        dispatch(deleteDeckFixture(area.id))
      }
    })
  }

  return (
    <Formik
      onSubmit={onSaveClick}
      initialValues={{
        selectedSlots: stagingAreaLocations ?? [],
      }}
    >
      <ModalShell width="48rem">
        <Box marginTop={SPACING.spacing32} paddingX={SPACING.spacing32}>
          <Text as="h2">
            {i18n.t(`modules.additional_equipment_display_names.stagingAreas`)}
          </Text>
        </Box>
        <StagingAreasModalComponent
          onCloseClick={onCloseClick}
          stagingAreas={stagingAreas}
        />
      </ModalShell>
    </Formik>
  )
}
