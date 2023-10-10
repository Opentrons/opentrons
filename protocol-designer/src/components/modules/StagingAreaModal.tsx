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
  DeckConfigurator,
} from '@opentrons/components'
import {
  DeckConfiguration,
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  STAGING_AREA_LOAD_NAME,
  WASTE_CHUTE_SLOT,
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
import { AdditionalEquipmentEntity } from '@opentrons/step-generation'
import { getStagingAreaSlots } from '../../utils'

export interface StagingAreaValues {
  selectedSlots: string[]
}

const StagingAreaModalComponent = (
  props: StagingAreaModalProps
): JSX.Element => {
  const { onCloseClick, stagingAreas } = props
  const { values, setFieldValue } = useFormikContext<StagingAreaValues>()
  const initialDeckSetup = useSelector(getInitialDeckSetup)
  //   const isSlotEmpty = getSlotIsEmpty(initialDeckSetup, values.selectedSlot)
  const flexDeck = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const [field] = useField('selectedSlot')
  const mappedStagingAreas = stagingAreas.flatMap(area => {
    return [
      {
        fixtureId: area.id,
        fixtureLocation: area.location ?? '',
        loadName: STAGING_AREA_LOAD_NAME,
      },
    ] as DeckConfiguration
  })

  const handleClickAdd = (fixtureLocation: string): void => {
    const updatedSelectedSlots = [...values.selectedSlots, fixtureLocation]
    setFieldValue('selectedSlots', updatedSelectedSlots)
  }

  const handleClickRemove = (fixtureLocation: string) => {
    const updatedSelectedSlots = values.selectedSlots.filter(
      item => item !== fixtureLocation
    )
    setFieldValue('selectedSlots', updatedSelectedSlots)
  }

  return (
    <Form>
      <Box paddingX={SPACING.spacing32} paddingTop={SPACING.spacing16}>
        <Flex
          justifyContent={JUSTIFY_END}
          height="3.125rem"
          alignItems={ALIGN_CENTER}
        >
          {/* <Box>
            {!isSlotEmpty ? (
              <PDAlert
                alertType="warning"
                title={i18n.t('alert.module_placement.SLOT_OCCUPIED.title')}
                description={''}
              />
            ) : null}
          </Box> */}
        </Flex>

        <Flex height="20rem" justifyContent={JUSTIFY_CENTER}>
          <DeckConfigurator
            deckConfig={mappedStagingAreas}
            handleClickAdd={handleClickAdd}
            handleClickRemove={handleClickRemove}
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
        <OutlineButton type={BUTTON_TYPE_SUBMIT}>
          {i18n.t('button.save')}
        </OutlineButton>
      </Flex>
    </Form>
  )
}

export interface StagingAreaModalProps {
  onCloseClick: () => void
  stagingAreas: AdditionalEquipmentEntity[]
}

export const StagingAreaModal = (props: StagingAreaModalProps): JSX.Element => {
  const { onCloseClick, stagingAreas } = props
  const dispatch = useDispatch()
  const stagingAreaLocations = getStagingAreaSlots(stagingAreas)

  const onSaveClick = (values: StagingAreaValues): void => {
    values.selectedSlots.forEach(slot => {
      dispatch(createDeckFixture('stagingArea', slot))
    })

    onCloseClick()
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
            {i18n.t(`modules.additional_equipment_display_names.stagingArea`)}
          </Text>
        </Box>
        <StagingAreaModalComponent
          onCloseClick={onCloseClick}
          stagingAreas={stagingAreas}
        />
      </ModalShell>
    </Formik>
  )
}
