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
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
} from '@opentrons/shared-data'
import { i18n } from '../../localization'
import { OUTER_SLOTS_FLEX } from '../../modules'
import { createContainer } from '../../labware-ingred/actions'
import { FLEX_TRASH_DEF_URI } from '../../constants'
import { getSlotIsEmpty } from '../../step-forms'
import { getInitialDeckSetup } from '../../step-forms/selectors'
import { SlotDropdown } from '../modals/EditModulesModal/SlotDropdown'
import { PDAlert } from '../alerts/PDAlert'

export interface TrashBinValues {
  selectedSlot: string
}

const TrashBinModalComponent = (props: TrashBinModalProps): JSX.Element => {
  const { onCloseClick } = props
  const { values } = useFormikContext<TrashBinValues>()
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  const isSlotEmpty = getSlotIsEmpty(initialDeckSetup, values.selectedSlot)
  const flexDeck = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const [field] = useField('selectedSlot')

  return (
    <Form>
      <Box paddingX={SPACING.spacing32} paddingTop={SPACING.spacing16}>
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          height="3.125rem"
          alignItems={ALIGN_CENTER}
        >
          <Box height="3.125rem">
            <FormGroup label="Position">
              <Box width={'8rem'}>
                <SlotDropdown
                  fieldName="selectedSlot"
                  options={OUTER_SLOTS_FLEX}
                  disabled={false}
                  tabIndex={1}
                />
              </Box>
            </FormGroup>
          </Box>

          <Box>
            {!isSlotEmpty ? (
              <PDAlert
                alertType="warning"
                title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
                description={''}
              />
            ) : null}
          </Box>
        </Flex>

        <Flex height="20rem" justifyContent={JUSTIFY_CENTER}>
          <DeckLocationSelect
            deckDef={flexDeck}
            selectedLocation={{ slotName: field.value }}
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

export interface TrashBinModalProps {
  onCloseClick: () => void
}

export const TrashBinModal = (props: TrashBinModalProps): JSX.Element => {
  const { onCloseClick } = props
  const dispatch = useDispatch()

  const onSaveClick = (values: TrashBinValues): void => {
    dispatch(
      createContainer({
        labwareDefURI: FLEX_TRASH_DEF_URI,
        slot: values.selectedSlot,
      })
    )
    onCloseClick()
  }

  return (
    <Formik onSubmit={onSaveClick} initialValues={{ selectedSlot: 'A3' }}>
      <ModalShell width="48rem">
        <Box marginTop={SPACING.spacing32} paddingX={SPACING.spacing32}>
          <Text as="h2">
            {i18n.t(`modules.additional_equipment_display_names.trashBin`)}
          </Text>
        </Box>
        <TrashBinModalComponent onCloseClick={onCloseClick} />
      </ModalShell>
    </Formik>
  )
}
