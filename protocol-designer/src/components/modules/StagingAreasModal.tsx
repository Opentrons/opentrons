import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Control,
  Controller,
  ControllerRenderProps,
  useForm,
  useWatch,
} from 'react-hook-form'
import {
  BUTTON_TYPE_SUBMIT,
  OutlineButton,
  ModalShell,
  Flex,
  SPACING,
  DIRECTION_ROW,
  Box,
  Text,
  ALIGN_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_END,
  DeckConfigurator,
  DIRECTION_COLUMN,
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

interface StagingAreaModalComponentProps extends StagingAreasModalProps {
  control: Control<StagingAreasValues, 'selectedSlots'>
  stagingAreaLocations: string[] | null
}

const StagingAreasModalComponent = (
  props: StagingAreaModalComponentProps
): JSX.Element => {
  const { onCloseClick, stagingAreas, control, stagingAreaLocations } = props
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const hasWasteChute =
    Object.values(initialDeckSetup.additionalEquipmentOnDeck).find(
      aE => aE.name === 'wasteChute'
    ) != null
  const selectedSlots = useWatch({
    control,
    name: 'selectedSlots',
    defaultValue: stagingAreaLocations ?? [],
  })

  const areSlotsEmpty = selectedSlots.map(slot => {
    if (slot === 'cutoutD3' && hasWasteChute) {
      return true
    } else {
      return getSlotIsEmpty(initialDeckSetup, slot)
    }
  })

  const hasConflictedSlot = areSlotsEmpty.includes(false)

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

  const handleClickAdd = (
    cutoutId: string,
    field: ControllerRenderProps<StagingAreasValues, 'selectedSlots'>
  ): void => {
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
    const updatedSelectedSlots = [...selectedSlots, cutoutId]
    field.onChange(updatedSelectedSlots)
  }

  const handleClickRemove = (
    cutoutId: string,
    field: ControllerRenderProps<StagingAreasValues, 'selectedSlots'>
  ): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.cutoutId === cutoutId) {
        return { ...slot, cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE }
      }
      return slot
    })
    setUpdatedSlots(modifiedSlots)

    field.onChange(selectedSlots.filter(item => item !== cutoutId))
  }

  return (
    <>
      <Flex height="23rem" flexDirection={DIRECTION_COLUMN}>
        <Flex
          justifyContent={JUSTIFY_END}
          alignItems={ALIGN_CENTER}
          height="4rem"
          paddingX={SPACING.spacing32}
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
        <Controller
          name="selectedSlots"
          control={control}
          defaultValue={stagingAreaLocations ?? []}
          render={({ field }) => (
            <DeckConfigurator
              deckConfig={updatedSlots}
              handleClickAdd={cutoutId => handleClickAdd(cutoutId, field)}
              handleClickRemove={cutoutId => handleClickRemove(cutoutId, field)}
              showExpansion={false}
            />
          )}
        ></Controller>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_FLEX_END}
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
    </>
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
  const { control, handleSubmit } = useForm<StagingAreasValues>()
  const stagingAreaLocations = getStagingAreaSlots(stagingAreas)

  const onSaveClick = (data: StagingAreasValues): void => {
    onCloseClick()

    data.selectedSlots.forEach(slot => {
      if (!stagingAreaLocations?.includes(slot)) {
        dispatch(createDeckFixture('stagingArea', slot))
      }
    })
    Object.values(stagingAreas).forEach(area => {
      if (!data.selectedSlots.includes(area.location as string)) {
        dispatch(deleteDeckFixture(area.id))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSaveClick)}>
      <ModalShell width="48rem">
        <Box marginTop={SPACING.spacing32} paddingX={SPACING.spacing32}>
          <Text as="h2">
            {i18n.t(`modules.additional_equipment_display_names.stagingAreas`)}
          </Text>
        </Box>
        <StagingAreasModalComponent
          onCloseClick={onCloseClick}
          stagingAreas={stagingAreas}
          control={control}
          stagingAreaLocations={stagingAreaLocations}
        />
      </ModalShell>
    </form>
  )
}
