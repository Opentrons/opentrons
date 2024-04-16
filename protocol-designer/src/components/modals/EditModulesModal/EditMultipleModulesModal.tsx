import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
  DeckConfiguration,
  SINGLE_RIGHT_SLOT_FIXTURE,
  TEMPERATURE_MODULE_CUTOUTS,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
  TEMPERATURE_MODULE_V2_FIXTURE,
} from '@opentrons/shared-data'
import { createModule, deleteModule } from '../../../step-forms/actions'
import { getSlotIsEmpty } from '../../../step-forms'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { PDAlert } from '../../alerts/PDAlert'
import type { CutoutId, ModuleType } from '@opentrons/shared-data'
import type { ModuleOnDeck } from '../../../step-forms'

export interface EditMultipleModulesModalValues {
  selectedAddressableAreas: string[]
}

interface EditMultipleModulesModalComponentProps
  extends EditMultipleModulesModalProps {
  control: Control<EditMultipleModulesModalValues, 'selectedAddressableAreas'>
  moduleLocations: string[] | null
}

const EditMultipleModulesModalComponent = (
  props: EditMultipleModulesModalComponentProps
): JSX.Element => {
  const { t } = useTranslation(['button', 'alert'])
  const { onCloseClick, modules, control, moduleLocations, moduleType } = props
  const initialDeckSetup = useSelector(getInitialDeckSetup)

  const selectedSlots = useWatch({
    control,
    name: 'selectedAddressableAreas',
    defaultValue: moduleLocations ?? [],
  })

  const areSlotsEmpty = selectedSlots.map(slot => {
    return (
      getSlotIsEmpty(initialDeckSetup, slot) &&
      modules.find(module => module.type === moduleType && module.slot !== slot)
    )
  })

  const hasConflictedSlot = areSlotsEmpty.includes(false)
  const mappedStagingAreas: DeckConfiguration =
    modules.length > 0
      ? modules.flatMap(module => {
          return [
            {
              cutoutId: `cutout${module.slot}` as CutoutId,
              cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
            },
          ]
        })
      : []
  const STANDARD_EMPTY_SLOTS: DeckConfiguration = TEMPERATURE_MODULE_CUTOUTS.map(
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
    field: ControllerRenderProps<
      EditMultipleModulesModalValues,
      'selectedAddressableAreas'
    >
  ): void => {
    const modifiedSlots: DeckConfiguration = updatedSlots.map(slot => {
      if (slot.cutoutId === cutoutId) {
        return {
          ...slot,
          cutoutFixtureId: TEMPERATURE_MODULE_V2_FIXTURE,
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
    field: ControllerRenderProps<
      EditMultipleModulesModalValues,
      'selectedAddressableAreas'
    >
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
                title={'Slot occupied'}
                description={''}
              />
            ) : null}
          </Box>
        </Flex>
        <Controller
          name="selectedAddressableAreas"
          control={control}
          defaultValue={moduleLocations ?? []}
          render={({ field }) => (
            <DeckConfigurator
              deckConfig={updatedSlots}
              handleClickAdd={cutoutId => handleClickAdd(cutoutId, field)}
              handleClickRemove={cutoutId => handleClickRemove(cutoutId, field)}
              showExpansion={false}
            />
          )}
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_FLEX_END}
        paddingRight={SPACING.spacing32}
        paddingBottom={SPACING.spacing32}
        gridGap={SPACING.spacing8}
      >
        <OutlineButton onClick={onCloseClick}>{t('cancel')}</OutlineButton>
        <OutlineButton type={BUTTON_TYPE_SUBMIT} disabled={hasConflictedSlot}>
          {t('save')}
        </OutlineButton>
      </Flex>
    </>
  )
}

export interface EditMultipleModulesModalProps {
  onCloseClick: () => void
  modules: ModuleOnDeck[]
  moduleType: ModuleType
}
export const EditMultipleModulesModal = (
  props: EditMultipleModulesModalProps
): JSX.Element => {
  const { onCloseClick, modules, moduleType } = props
  const { t } = useTranslation('modules')
  const dispatch = useDispatch()
  const { control, handleSubmit } = useForm<EditMultipleModulesModalValues>()
  const moduleLocations = Object.values(modules)
    .filter(module => module.type === moduleType)
    .map(temp => `cutout${temp.slot}`)
  const onSaveClick = (data: EditMultipleModulesModalValues): void => {
    onCloseClick()

    data.selectedAddressableAreas.forEach(aa => {
      if (!moduleLocations?.includes(aa)) {
        dispatch(
          createModule({
            slot: aa.split('cutout')[1],
            type: TEMPERATURE_MODULE_TYPE,
            model: TEMPERATURE_MODULE_V2,
          })
        )
      } else {
      }
    })
    Object.values(modules).forEach(module => {
      if (!data.selectedAddressableAreas.includes(module.slot)) {
        dispatch(deleteModule(module.id))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSaveClick)}>
      <ModalShell width="48rem">
        <Box marginTop={SPACING.spacing32} paddingX={SPACING.spacing32}>
          <Text as="h2">{'Temperature modules'}</Text>
        </Box>
        <EditMultipleModulesModalComponent
          onCloseClick={onCloseClick}
          modules={modules}
          control={control}
          moduleLocations={moduleLocations}
          moduleType={moduleType}
        />
      </ModalShell>
    </form>
  )
}
