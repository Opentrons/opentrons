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
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import { i18n } from '../../localization'
import { OUTER_SLOTS_FLEX } from '../../modules'
import { createContainer, deleteContainer } from '../../labware-ingred/actions'
import { FLEX_TRASH_DEF_URI } from '../../constants'
import { createDeckFixture } from '../../step-forms/actions/additionalItems'
import { getSlotIsEmpty } from '../../step-forms'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { SlotDropdown } from '../modals/EditModulesModal/SlotDropdown'
import { PDAlert } from '../alerts/PDAlert'

export interface TrashValues {
  selectedSlot: string
}

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
                    options={OUTER_SLOTS_FLEX}
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
            selectedLocation={{ slotName: field.value }}
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
      dispatch(
        createContainer({
          labwareDefURI: FLEX_TRASH_DEF_URI,
          slot: values.selectedSlot,
        })
      )
    } else if (trashName === 'trashBin' && trashBinId != null) {
      dispatch(
        deleteContainer({
          labwareId: trashBinId,
        })
      )
      dispatch(
        createContainer({
          labwareDefURI: FLEX_TRASH_DEF_URI,
          slot: values.selectedSlot,
        })
      )
    } else if (trashName === 'wasteChute') {
      dispatch(createDeckFixture('wasteChute', WASTE_CHUTE_CUTOUT))
    }

    onCloseClick()
  }

  return (
    <Formik
      onSubmit={onSaveClick}
      initialValues={{
        selectedSlot: trashName === 'trashBin' ? 'A3' : WASTE_CHUTE_CUTOUT,
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
