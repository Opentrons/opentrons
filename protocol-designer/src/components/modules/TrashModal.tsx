import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Control,
  Controller,
  useForm,
  UseFormWatch,
  useWatch,
} from 'react-hook-form'
import { useSelector, useDispatch } from 'react-redux'
import {
  FormGroup,
  BUTTON_TYPE_SUBMIT,
  OutlineButton,
  ModalShell,
  Flex,
  SPACING,
  DIRECTION_ROW,
  Box,
  DeckLocationSelect,
  Text,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
  JUSTIFY_END,
  DropdownOption,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  createDeckFixture,
  deleteDeckFixture,
} from '../../step-forms/actions/additionalItems'
import { getSlotIsEmpty } from '../../step-forms'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { SlotDropdown } from '../modals/EditModulesModal/SlotDropdown'
import { PDAlert } from '../alerts/PDAlert'

export interface TrashValues {
  selectedSlot: string
}

export const MOVABLE_TRASH_CUTOUTS: DropdownOption[] = [
  {
    name: 'Slot A1',
    value: 'cutoutA1',
  },
  {
    name: 'Slot A3',
    value: 'cutoutA3',
  },
  {
    name: 'Slot B1',
    value: 'cutoutB1',
  },
  {
    name: 'Slot B3',
    value: 'cutoutB3',
  },
  {
    name: 'Slot C1',
    value: 'cutoutC1',
  },
  {
    name: 'Slot C3',
    value: 'cutoutC3',
  },
  {
    name: 'Slot D1',
    value: 'cutoutD1',
  },
  {
    name: 'Slot D3',
    value: 'cutoutD3',
  },
]

interface TrashModalComponentProps extends TrashModalProps {
  control: Control<TrashValues, 'selectedSlot'>
}
const TrashModalComponent = (props: TrashModalComponentProps): JSX.Element => {
  const { onCloseClick, trashName, control } = props
  const { t } = useTranslation(['alert', 'button'])
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const defaultValue =
    trashName === 'trashBin' ? 'cutoutA3' : WASTE_CHUTE_CUTOUT
  const selectedSlot = useWatch({
    control,
    name: 'selectedSlot',
    defaultValue: defaultValue,
  })
  const isSlotEmpty = getSlotIsEmpty(
    initialDeckSetup,
    selectedSlot,
    trashName === 'trashBin'
  )
  const slotFromCutout = selectedSlot.replace('cutout', '')
  const flexDeck = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  return (
    <>
      <Box paddingX={SPACING.spacing32} paddingTop={SPACING.spacing16}>
        <Flex
          justifyContent={
            trashName === 'trashBin' ? JUSTIFY_SPACE_BETWEEN : JUSTIFY_END
          }
          height="3.125rem"
          alignItems={ALIGN_CENTER}
        >
          {trashName === 'trashBin' ? (
            <Box height="3.125rem">
              <FormGroup label="Position">
                <Box width="8rem">
                  <Controller
                    name="selectedSlot"
                    control={control}
                    defaultValue={defaultValue}
                    render={({ field, fieldState }) => (
                      <SlotDropdown
                        fieldName="selectedSlot"
                        options={MOVABLE_TRASH_CUTOUTS}
                        disabled={false}
                        tabIndex={1}
                        field={field}
                        fieldState={fieldState}
                      />
                    )}
                  />
                </Box>
              </FormGroup>
            </Box>
          ) : null}

          <Box>
            {!isSlotEmpty ? (
              <PDAlert
                alertType="warning"
                title={t(`deck_config_placement.SLOT_OCCUPIED.${trashName}`)}
                description={''}
              />
            ) : null}
          </Box>
        </Flex>

        <Flex height="20rem" justifyContent={JUSTIFY_CENTER}>
          <DeckLocationSelect
            deckDef={flexDeck}
            selectedLocation={{ slotName: slotFromCutout }}
            theme="grey"
          />
        </Flex>
      </Box>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_FLEX_END}
        paddingRight={SPACING.spacing32}
        paddingBottom={SPACING.spacing32}
        gridGap={SPACING.spacing8}
      >
        <OutlineButton onClick={onCloseClick}>
          {t('button:cancel')}
        </OutlineButton>
        <OutlineButton disabled={!isSlotEmpty} type={BUTTON_TYPE_SUBMIT}>
          {t('button:save')}
        </OutlineButton>
      </Flex>
    </>
  )
}

export interface TrashModalProps {
  onCloseClick: () => void
  trashName: 'wasteChute' | 'trashBin'
  trashBinId?: string
}

export const TrashModal = (props: TrashModalProps): JSX.Element => {
  const { onCloseClick, trashName, trashBinId } = props
  const { handleSubmit, control } = useForm<TrashValues>()

  const dispatch = useDispatch()
  const { t } = useTranslation('modules')

  const onSaveClick = (data: TrashValues) => {
    if (trashName === 'trashBin' && trashBinId == null) {
      dispatch(createDeckFixture('trashBin', data.selectedSlot))
    } else if (trashName === 'trashBin' && trashBinId != null) {
      dispatch(deleteDeckFixture(trashBinId))
      dispatch(createDeckFixture('trashBin', data.selectedSlot))
    } else if (trashName === 'wasteChute') {
      dispatch(createDeckFixture('wasteChute', WASTE_CHUTE_CUTOUT))
    }

    onCloseClick()
  }

  return (
    <form onSubmit={handleSubmit(onSaveClick)}>
      <ModalShell width="48rem">
        <Box marginTop={SPACING.spacing32} paddingX={SPACING.spacing32}>
          <Text as="h2">
            {t(`additional_equipment_display_names.${trashName}`)}
          </Text>
        </Box>
        <TrashModalComponent
          onCloseClick={onCloseClick}
          trashName={trashName}
          control={control}
        />
      </ModalShell>
    </form>
  )
}
