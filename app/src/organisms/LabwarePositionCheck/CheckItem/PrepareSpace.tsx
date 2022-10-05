import * as React from 'react'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import {
  LabwareRender,
  Module,
  RobotWorkSpace,
  Flex,
  Box,
  JUSTIFY_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  THERMOCYCLER_MODULE_V1,
  inferModuleOrientationFromXCoordinate,
  CompletedProtocolAnalysis,
  getLabwareDefURI,
  getModuleDef2,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { PrimaryButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import { getLabwareDefinitionsFromCommands } from '../utils/labware'
import { CheckTipRacksStep } from '../types'
import { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import { useTranslation } from 'react-i18next'

const DECK_MAP_VIEWBOX = '-80 -20 550 460'
const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]
interface PrpareSpaceProps extends Omit<CheckTipRacksStep, 'section'> {
  runId: string
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
}
export const PrepareSpace = (props: PrpareSpaceProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const { runId, location, labwareId, protocolData } = props
  const { createCommand } = useCreateCommandMutation()

  // const initialSavePositionCommandId = (savePositionCommandData[labwareId] ??
  //   [])[0]
  // const initialSavePositionCommand = useCommandQuery(
  //   runId,
  //   initialSavePositionCommandId
  // )?.data?.data
  // const initialPosition =
  //   initialSavePositionCommand?.commandType === 'savePosition'
  //     ? initialSavePositionCommand.result.position
  //     : null

  if (protocolData == null) return null
  const labwareDefUri = protocolData.labware.find(l => l.id === labwareId)
    ?.definitionUri
  const labwareDefinitions = getLabwareDefinitionsFromCommands(
    protocolData.commands
  )
  const labwareDef = labwareDefinitions.find(
    def => getLabwareDefURI(def) === labwareDefUri
  )
  if (labwareDef == null) return null

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex>
        <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
          <StyledText as="h3">
            {t('prepare_item', {
              item: labwareId,
              location: location?.slotName ?? location.moduleId,
            })}
          </StyledText>
          <ul>
            <li>
              <StyledText as="p">{t('place_modules')}</StyledText>
            </li>
            <li>
              <StyledText as="p">{t('clear_all_slots')}</StyledText>
            </li>
          </ul>
        </Flex>
        <Box flex="1">
          <RobotWorkSpace
            deckDef={standardDeckDef as any}
            viewBox={DECK_MAP_VIEWBOX}
            deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
            id="LabwarePositionCheck_deckMap"
          >
            {({ deckSlotsById }) => {
              if ('moduleId' in location) {
                const moduleLoadCommand = protocolData.commands.find(
                  (command): command is LoadModuleRunTimeCommand =>
                    command.commandType === 'loadModule' &&
                    command.params.moduleId === location.moduleId
                )
                if (moduleLoadCommand == null) return null
                const { location: modLoc, model } = moduleLoadCommand.params
                const deckSlot = deckSlotsById[modLoc.slotName]
                const moduleDef = getModuleDef2(model)
                return (
                  <Module
                    x={deckSlot.position[0]}
                    y={deckSlot.position[1]}
                    orientation={inferModuleOrientationFromXCoordinate(
                      deckSlot.position[x]
                    )}
                    def={moduleDef}
                    innerProps={
                      moduleDef.model === THERMOCYCLER_MODULE_V1
                        ? { lidMotorState: 'open' }
                        : {}
                    }
                  >
                    <LabwareRender definition={labwareDef} />
                  </Module>
                )
              } else {
                const slotName = location.slotName
                const deckSlot = deckSlotsById[slotName]
                return (
                  <g
                    transform={`translate(${deckSlot.position[0]},${deckSlot.position[1]})`}
                  >
                    <LabwareRender definition={labwareDef} />
                  </g>
                )
              }
            }}
          </RobotWorkSpace>
        </Box>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing4}>
        <PrimaryButton onClick={props.proceed}>CONFIRM PLACEMENT</PrimaryButton>
      </Flex>
    </Flex>
  )
}
