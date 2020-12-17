// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import isEqual from 'lodash/isEqual'

import {
  ALIGN_FLEX_START,
  BORDER_SOLID_MEDIUM,
  Box,
  DISPLAY_INLINE,
  DIRECTION_COLUMN,
  Flex,
  FONT_HEADER_DARK,
  FONT_SIZE_BODY_1,
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
} from '@opentrons/components'
import * as Sessions from '../../sessions'
import { NeedHelpLink } from './NeedHelpLink'
import { ChosenTipRackRender } from './ChosenTipRackRender'
import { getLatestLabwareDef } from '../../getLabware'
import { getCustomTipRackDefinitions } from '../../custom-labware'
import { getAttachedPipettes } from '../../pipettes'
import { getLabwareDefURI } from '@opentrons/shared-data'

import type { Intent } from './types'
import type { AttachedPipette } from '../../pipettes/types'
import type { SessionType, CalibrationLabware } from '../../sessions/types'
import type { State } from '../../types'
import type { SelectOptionOrGroup, SelectOption } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import styles from './styles.css'
import { INTENT_PIPETTE_OFFSET } from './constants'
import { findLabwareDefWithCustom } from '../../findLabware'

const HEADER = 'choose tip rack'
const INTRO = 'Choose what tip rack you would like to use to calibrate your'
const PIP_OFFSET_INTRO_FRAGMENT = 'Pipette Offset'
const DECK_CAL_INTRO_FRAGMENT = 'Deck'

const PROMPT =
  'Want to use a tip rack that is not listed here? Go to More > Custom Labware to add labware.'

const CALIBRATED_LABEL = 'calibrated'
const NOT_YET_CALIBRATED_LABEL = 'not yet calibrated'

const SELECT_TIP_RACK = 'select tip rack'
const NOTE_HEADER = 'Please note:'
const NOTE_BODY =
  'Opentrons cannot guarantee accuracy with third party tip racks.'
const USE_THIS_TIP_RACK = 'use this tip rack'

const introContentByType: SessionType => string = sessionType => {
  switch (sessionType) {
    case Sessions.SESSION_TYPE_DECK_CALIBRATION:
      return `${INTRO} ${DECK_CAL_INTRO_FRAGMENT}.`
    case Sessions.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION:
      return `${INTRO} ${PIP_OFFSET_INTRO_FRAGMENT}.`
    default:
      return 'This panel is shown in error'
  }
}

function getLabwareDefinitionFromUri(
  uri: string,
  customTipRacks: Array<LabwareDefinition2>
) {
  const [namespace, loadName, version] = uri.split('/')
  const labwareDef = findLabwareDefWithCustom(
    namespace,
    loadName,
    version,
    customTipRacks
  )
  return labwareDef
}

function formatOptionsFromLabwareDef(lw: LabwareDefinition2) {
  return {
    label: lw.metadata.displayName,
    value: getLabwareDefURI(lw),
  }
}

function getOptionsByIntent(
  tipRackOptions: array<SelectOptionOrGroup>,
  intent: ?Intent
) {
  switch (intent) {
    case INTENT_PIPETTE_OFFSET: {
      // TODO: find out which tiprack has been calbirated using lodash.partition
      return [
        { label: CALIBRATED_LABEL, options: [] },
        { label: NOT_YET_CALIBRATED_LABEL, options: tipRackOptions },
      ]
    }
    default:
      return tipRackOptions
  }
}

type ChooseTipRackProps = {|
  tipRack: CalibrationLabware,
  sessionType: SessionType,
  chosenTipRack: LabwareDefinition2 | null,
  handleChosenTipRack: (arg: LabwareDefinition2) => mixed,
  closeModal: () => mixed,
  intent?: Intent,
|}

export function ChooseTipRack(props: ChooseTipRackProps): React.Node {
  const {
    tipRack,
    sessionType,
    chosenTipRack,
    handleChosenTipRack,
    closeModal,
    intent,
  } = props

  const customTipRacks = useSelector(getCustomTipRackDefinitions)
  const customTipRackOptions = customTipRacks.map(formatOptionsFromLabwareDef)

  const opentronsTipRacks = [
    'opentrons/opentrons_96_tiprack_10ul/1',
    'opentrons/opentrons_96_tiprack_20ul/1',
    'opentrons/opentrons_96_tiprack_300ul/1',
  ].map(tr => getLabwareDefinitionFromUri(tr, customTipRacks)) // THIS IS WHAT WE WILL BE GETTING FROM THE SESSION

  const allTipRackDefs = opentronsTipRacks.concat(customTipRacks)

  const allTipRackOptions = allTipRackDefs.map(lw => {
    if (lw) {
      const uri = getLabwareDefURI(lw)
      return { label: lw.metadata.displayName, value: uri }
    }
  })

  const tipRackByUriMap = allTipRackDefs.reduce((obj, lw) => {
    if (lw) {
      obj[getLabwareDefURI(lw)] = lw
    }
    return obj
  }, {})

  const groupOptions = getOptionsByIntent(allTipRackOptions, intent)

  const [selectedValue, setSelectedValue] = React.useState<SelectOption>(
    formatOptionsFromLabwareDef(tipRack.definition)
  )

  const handleValueChange = (selected: SelectOption | null, _) => {
    selected && setSelectedValue(selected)
  }
  const handleUseTipRack = () => {
    const selectedTipRack = tipRackByUriMap[selectedValue.value]
    console.log(selectedTipRack)
    if (!isEqual(chosenTipRack, selectedTipRack)) {
      handleChosenTipRack(selectedTipRack)
    }
    closeModal()
  }
  const introText = introContentByType(sessionType)
  return (
    <Flex
      key={'chooseTipRack'}
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
      <Box marginBottom={SPACING_4}>
        <Text marginBottom={SPACING_3}>{introText}</Text>
        <Text>{PROMPT}</Text>
      </Box>
      <Flex
        width="80%"
        marginBottom={SPACING_2}
        justifyContent={JUSTIFY_CENTER}
        flexDirection={DIRECTION_COLUMN}
        alignSelf={ALIGN_CENTER}
      >
        <Flex
          height="16rem"
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
              selectedValue={selectedValue}
              intent={intent}
            />
          </Box>
        </Flex>
        <Flex marginBottom={SPACING_4} fontSize={FONT_SIZE_BODY_1}>
          <Text
            display={DISPLAY_INLINE}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            textTransform={TEXT_TRANSFORM_UPPERCASE}
          >
            {NOTE_HEADER}
          </Text>
          &nbsp;
          <Text>{NOTE_BODY}</Text>
        </Flex>
      </Flex>
      <PrimaryBtn
        alignSelf={ALIGN_CENTER}
        width="50%"
        onClick={handleUseTipRack}
      >
        {USE_THIS_TIP_RACK}
      </PrimaryBtn>
    </Flex>
  )
}
