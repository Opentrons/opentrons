import * as React from 'react'
import { useSelector } from 'react-redux'
import { head } from 'lodash'
import isEqual from 'lodash/isEqual'

import {
  AlertItem,
  ALIGN_FLEX_START,
  BORDER_SOLID_MEDIUM,
  Box,
  DIRECTION_COLUMN,
  Flex,
  FONT_HEADER_DARK,
  FONT_SIZE_BODY_2,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  POSITION_RELATIVE,
  PrimaryBtn,
  Select,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  Text,
  TEXT_TRANSFORM_UPPERCASE,
  TEXT_TRANSFORM_CAPITALIZE,
  FONT_WEIGHT_SEMIBOLD,
  ALIGN_CENTER,
  SecondaryBtn,
  SIZE_5,
} from '@opentrons/components'
import * as Sessions from '../../redux/sessions'
import { NeedHelpLink } from './NeedHelpLink'
import { ChosenTipRackRender } from './ChosenTipRackRender'
import { getCustomTipRackDefinitions } from '../../redux/custom-labware'
import { getAttachedPipettes } from '../../redux/pipettes'
import {
  getCalibrationForPipette,
  getTipLengthCalibrations,
  getTipLengthForPipetteAndTiprack,
} from '../../redux/calibration/'
import { getLabwareDefURI } from '@opentrons/shared-data'
import styles from './styles.css'

import type { TipRackMap } from './ChosenTipRackRender'
import type {
  SessionType,
  CalibrationLabware,
} from '../../redux/sessions/types'
import type { State } from '../../redux/types'
import type { SelectOption, SelectOptionOrGroup } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { Mount } from '../../redux/pipettes/types'

const HEADER = 'choose tip rack'
const INTRO = 'Choose what tip rack you would like to use to calibrate your'
const PIP_OFFSET_INTRO_FRAGMENT = 'Pipette Offset'
const DECK_CAL_INTRO_FRAGMENT = 'Deck'

const PROMPT =
  'Want to use a tip rack that is not listed here? Go to More > Custom Labware to add labware.'

const SELECT_TIP_RACK = 'select tip rack'
const ALERT_TEXT =
  'Opentrons tip racks are strongly recommended. Accuracy cannot be guaranteed with other tip racks.'

const OPENTRONS_LABEL = 'opentrons'
const CUSTOM_LABEL = 'custom'
const USE_THIS_TIP_RACK = 'use this tip rack'

const introContentByType = (sessionType: SessionType): string => {
  switch (sessionType) {
    case Sessions.SESSION_TYPE_DECK_CALIBRATION:
      return `${INTRO} ${DECK_CAL_INTRO_FRAGMENT}.`
    case Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION:
      return `${INTRO} ${PIP_OFFSET_INTRO_FRAGMENT}.`
    default:
      return 'This panel is shown in error'
  }
}

function formatOptionsFromLabwareDef(lw: LabwareDefinition2): SelectOption {
  return {
    value: getLabwareDefURI(lw),
    label: lw.metadata.displayName,
  }
}

interface ChooseTipRackProps {
  tipRack: CalibrationLabware
  mount: Mount
  sessionType: SessionType
  chosenTipRack: LabwareDefinition2 | null
  handleChosenTipRack: (arg: LabwareDefinition2 | null) => unknown
  closeModal: () => unknown
  robotName?: string | null
  defaultTipracks?: LabwareDefinition2[] | null
}

export function ChooseTipRack(props: ChooseTipRackProps): JSX.Element {
  const {
    tipRack,
    mount,
    sessionType,
    chosenTipRack,
    handleChosenTipRack,
    closeModal,
    robotName,
    defaultTipracks,
  } = props

  const pipSerial = useSelector(
    (state: State) =>
      // @ts-expect-error(sa, 2021-05-26): possibly null, can optionally chain. leaving to avoid src code change
      robotName && getAttachedPipettes(state, robotName)[mount].id
  )

  const pipetteOffsetCal = useSelector((state: State) =>
    robotName && pipSerial
      ? getCalibrationForPipette(state, robotName, pipSerial, mount)
      : null
  )
  const tipLengthCal = useSelector((state: State) =>
    robotName && pipSerial && pipetteOffsetCal
      ? getTipLengthForPipetteAndTiprack(
          state,
          robotName,
          pipSerial,
          pipetteOffsetCal?.tiprack
        )
      : null
  )
  const allTipLengthCal = useSelector((state: State) =>
    robotName ? getTipLengthCalibrations(state, robotName) : []
  )
  const customTipRacks = useSelector(getCustomTipRackDefinitions)

  const allTipRackDefs = defaultTipracks
    ? defaultTipracks.concat(customTipRacks)
    : customTipRacks
  const tipRackByUriMap = allTipRackDefs.reduce<TipRackMap>((obj, lw) => {
    if (lw) {
      obj[getLabwareDefURI(lw)] = {
        definition: lw,
        calibration:
          head(
            allTipLengthCal.filter(
              cal =>
                cal.pipette === pipSerial && cal.uri === getLabwareDefURI(lw)
            )
          ) ||
          // Old tip length data don't have tiprack uri info, so we are using the
          // tiprack hash in pipette offset to check against tip length cal for
          // backward compatability purposes
          (pipetteOffsetCal &&
          tipLengthCal &&
          pipetteOffsetCal.tiprackUri === getLabwareDefURI(lw)
            ? tipLengthCal
            : null),
      }
    }
    return obj
  }, {})

  const opentronsTipRacksOptions: SelectOption[] = defaultTipracks
    ? defaultTipracks.map(lw => formatOptionsFromLabwareDef(lw))
    : []
  const customTipRacksOptions: SelectOption[] = customTipRacks.map(lw =>
    formatOptionsFromLabwareDef(lw)
  )

  const groupOptions: SelectOptionOrGroup[] =
    customTipRacks.length > 0
      ? [
          {
            label: OPENTRONS_LABEL,
            options: opentronsTipRacksOptions,
          },
          {
            label: CUSTOM_LABEL,
            options: customTipRacksOptions,
          },
        ]
      : [...opentronsTipRacksOptions]

  const [selectedValue, setSelectedValue] = React.useState<SelectOption>(
    chosenTipRack
      ? formatOptionsFromLabwareDef(chosenTipRack)
      : formatOptionsFromLabwareDef(tipRack.definition)
  )

  const handleValueChange = (
    selected: SelectOption | null,
    _: unknown
  ): void => {
    selected && setSelectedValue(selected)
  }
  const handleUseTipRack = (): void => {
    const selectedTipRack = tipRackByUriMap[selectedValue.value]
    // @ts-expect-error(sa, 2021-05-26): need to type narrow, avoiding src code change for now
    if (!isEqual(chosenTipRack, selectedTipRack.definition)) {
      // @ts-expect-error(sa, 2021-05-26): need to type narrow, avoiding src code change for now
      handleChosenTipRack(selectedTipRack.definition)
    }
    closeModal()
  }
  const introText = introContentByType(sessionType)
  return (
    <Flex
      key="chooseTipRack"
      marginTop={SPACING_2}
      marginBottom={SPACING_3}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_FLEX_START}
      position={POSITION_RELATIVE}
      fontSize={FONT_SIZE_BODY_2}
      width="100%"
    >
      <Flex width="100%" justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Text
          css={FONT_HEADER_DARK}
          marginBottom={SPACING_3}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
        >
          {HEADER}
        </Text>
        <NeedHelpLink />
      </Flex>
      <Box marginBottom={SPACING_3}>
        <Text marginBottom={SPACING_3}>{introText}</Text>
        <Text>{PROMPT}</Text>
      </Box>
      <Flex marginBottom={SPACING_4}>
        <AlertItem type="warning" title={ALERT_TEXT} />
      </Flex>
      <Flex
        width="80%"
        marginBottom={SPACING_4}
        justifyContent={JUSTIFY_CENTER}
        flexDirection={DIRECTION_COLUMN}
        alignSelf={ALIGN_CENTER}
      >
        <Flex
          height={SIZE_5}
          border={BORDER_SOLID_MEDIUM}
          paddingTop={SPACING_4}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          marginBottom={SPACING_2}
        >
          <Box width="55%" paddingLeft={SPACING_4}>
            <Text
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginBottom={SPACING_1}
            >
              {SELECT_TIP_RACK}
            </Text>
            <Select
              className={styles.select_tiprack_menu}
              options={groupOptions}
              onChange={handleValueChange}
              value={selectedValue}
            />
          </Box>
          <Box width="45%" height="100%">
            <ChosenTipRackRender
              showCalibrationText={
                sessionType === Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
              }
              selectedValue={selectedValue}
              tipRackByUriMap={tipRackByUriMap}
            />
          </Box>
        </Flex>
      </Flex>
      <Flex width="100%" justifyContent={JUSTIFY_CENTER}>
        <SecondaryBtn
          data-test="useThisTipRackButton"
          width="25%"
          marginRight={SPACING_3}
          onClick={() => closeModal()}
        >
          Cancel
        </SecondaryBtn>
        <PrimaryBtn
          data-test="useThisTipRackButton"
          width="48%"
          onClick={handleUseTipRack}
        >
          {USE_THIS_TIP_RACK}
        </PrimaryBtn>
      </Flex>
    </Flex>
  )
}
