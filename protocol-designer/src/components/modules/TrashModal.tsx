import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Form, Formik, useField, useFormikContext } from 'formik'
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
import { i18n } from '../../localization'
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

const TrashModalComponent = (props: TrashModalProps): JSX.Element => {
  const { onCloseClick, trashName } = props
  const { values } = useFormikContext<TrashValues>()
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const isSlotEmpty = getSlotIsEmpty(
    initialDeckSetup,
    values.selectedSlot,
    trashName === 'trashBin'
  )
  const flexDeck = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const [field] = useField('selectedSlot')
  const slotFromCutout = field.value.replace('cutout', '')

  return (
    <Form>
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
                  <SlotDropdown
                    fieldName="selectedSlot"
                    options={MOVABLE_TRASH_CUTOUTS}
                    disabled={false}
                    tabIndex={1}
                  />
                </Box>
              </FormGroup>
            </Box>
          ) : null}

          <Box>
            {!isSlotEmpty ? (
              <PDAlert
                alertType="warning"
                title={i18n.t(
                  `alert.deck_config_placement.SLOT_OCCUPIED.${trashName}`
                )}
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
          {i18n.t('button.cancel')}
        </OutlineButton>
        <OutlineButton disabled={!isSlotEmpty} type={BUTTON_TYPE_SUBMIT}>
          {i18n.t('button.save')}
        </OutlineButton>
      </Flex>
    </Form>
  )
}

export interface TrashModalProps {
  onCloseClick: () => void
  trashName: 'wasteChute' | 'trashBin'
  trashBinId?: string
}

export const TrashModal = (props: TrashModalProps): JSX.Element => {
  const { onCloseClick, trashName, trashBinId } = props
  const dispatch = useDispatch()

  const onSaveClick = (values: TrashValues): void => {
    if (trashName === 'trashBin' && trashBinId == null) {
      dispatch(createDeckFixture('trashBin', values.selectedSlot))
    } else if (trashName === 'trashBin' && trashBinId != null) {
      dispatch(deleteDeckFixture(trashBinId))
      dispatch(createDeckFixture('trashBin', values.selectedSlot))
    } else if (trashName === 'wasteChute') {
      dispatch(createDeckFixture('wasteChute', WASTE_CHUTE_CUTOUT))
    }

    onCloseClick()
  }

  return (
    <Formik
      onSubmit={onSaveClick}
      initialValues={{
        selectedSlot:
          trashName === 'trashBin' ? 'cutoutA3' : WASTE_CHUTE_CUTOUT,
      }}
    >
      <ModalShell width="48rem">
        <Box marginTop={SPACING.spacing32} paddingX={SPACING.spacing32}>
          <Text as="h2">
            {i18n.t(`modules.additional_equipment_display_names.${trashName}`)}
          </Text>
        </Box>
        <TrashModalComponent
          onCloseClick={onCloseClick}
          trashName={trashName}
        />
      </ModalShell>
    </Formik>
  )
}
