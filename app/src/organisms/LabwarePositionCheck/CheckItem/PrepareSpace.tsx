import * as React from 'react'
import {
  LabwareRender,
  Module,
  RobotWorkSpace,
  Flex,
  Box,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
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
  getIsTiprack,
  getModuleDisplayName,
  getLabwareDisplayName,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { PrimaryButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import { getLabwareDefinitionsFromCommands } from '../utils/labware'
import { CheckTipRacksStep } from '../types'
import { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import { Trans, useTranslation } from 'react-i18next'
import { NeedHelpLink } from '../../CalibrationPanels'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

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
interface PrepareSpaceProps extends Omit<CheckTipRacksStep, 'section'> {
  runId: string
  labwareDef: LabwareDefinition2
  protocolData: CompletedProtocolAnalysis
  confirmPlacement: () => void
  header: React.ReactNode
  body: React.ReactNode
}
export const PrepareSpace = (props: PrepareSpaceProps): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { location, labwareDef, protocolData, header, body } = props

  if (protocolData == null) return null
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <Flex gridGap={SPACING.spacingXXL}>
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing3}
        >
          <StyledText as="h1">{header}</StyledText>
          {body}
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
      <Flex
        width="100%"
        marginTop={SPACING.spacing6}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <PrimaryButton onClick={props.confirmPlacement}>
          {t('shared:confirm_placement')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}

