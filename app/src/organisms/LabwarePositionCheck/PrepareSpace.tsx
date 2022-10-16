import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  CompletedProtocolAnalysis,
  getModuleDef2,
  LabwareDefinition2,
  THERMOCYCLER_MODULE_TYPE,
  getModuleType,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'

import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { CheckTipRacksStep } from './types'
import { NeedHelpLink } from '../CalibrationPanels'

const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

const DECK_MAP_VIEWBOX = '-80 -20 550 466'
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
  section: 'CHECK_LABWARE' | 'CHECK_TIP_RACKS' | 'PICK_UP_TIP' | 'RETURN_TIP'
  labwareDef: LabwareDefinition2
  protocolData: CompletedProtocolAnalysis
  confirmPlacement: () => void
  header: React.ReactNode
  body: React.ReactNode
}
export const PrepareSpace = (props: PrepareSpaceProps): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { location, moduleId, labwareDef, protocolData, header, body } = props

  if (protocolData == null) return null
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <Flex gridGap={SPACING.spacingL}>
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
              const deckSlot = deckSlotsById[location.slotName]
              const [x, y] = deckSlot.position
              let labwareToPrepare = null
              if ('moduleModel' in location && location.moduleModel != null) {
                labwareToPrepare = (
                  <Module
                    x={x}
                    y={y}
                    orientation={inferModuleOrientationFromXCoordinate(
                      deckSlot.position[x]
                    )}
                    def={getModuleDef2(location.moduleModel)}
                    innerProps={
                      getModuleType(location.moduleModel) ===
                      THERMOCYCLER_MODULE_TYPE
                        ? { lidMotorState: 'open' }
                        : {}
                    }
                  >
                    <LabwareRender definition={labwareDef} />
                  </Module>
                )
              } else {
                labwareToPrepare = (
                  <g transform={`translate(${x},${y})`}>
                    <LabwareRender definition={labwareDef} />
                  </g>
                )
              }
              return (
                <>
                  {protocolData.modules.map(module => {
                    const [modX, modY] = deckSlotsById[
                      module.location.slotName
                    ].position

                    // skip the focused module as it will be rendered above with the labware
                    return module.id === moduleId ? null : (
                      <Module
                        key={module.id}
                        x={modX}
                        y={modY}
                        orientation={inferModuleOrientationFromXCoordinate(
                          modX
                        )}
                        def={getModuleDef2(module.model)}
                        innerProps={
                          getModuleType(module.model) ===
                          THERMOCYCLER_MODULE_TYPE
                            ? { lidMotorState: 'open' }
                            : {}
                        }
                      />
                    )
                  })}
                  {labwareToPrepare}
                </>
              )
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
