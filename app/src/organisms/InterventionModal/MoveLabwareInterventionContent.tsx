import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  Icon,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  BORDERS,
  Box,
  RobotWorkSpace,
  MoveLabwareOnDeck,
} from '@opentrons/components'

import { getLabwareRenderComponents, getModuleRenderComponents } from './utils'
import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'
import { getStandardDeckViewLayerBlockList } from '../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'

import type { DeckDefinition, LabwareLocation, RobotType } from '@opentrons/shared-data'
import type {
  LabwareAnimationParams,
  RunLabwareInfo,
  RunModuleInfo,
} from './utils'

export interface MoveLabwareInterventionProps {
  robotType: RobotType
  moduleRenderInfo: RunModuleInfo[]
  labwareRenderInfo: RunLabwareInfo[]
  labwareAnimationParams: LabwareAnimationParams
  labwareName: string
  movedLabwareId: string
  oldDisplayLocation: string
  oldLocation: LabwareLocation
  newDisplayLocation: string
  newLocation: LabwareLocation
  deckDef: DeckDefinition
}

export function MoveLabwareInterventionContent({
  robotType,
  labwareAnimationParams,
  labwareName,
  movedLabwareId,
  moduleRenderInfo,
  labwareRenderInfo,
  oldDisplayLocation,
  newDisplayLocation,
  oldLocation,
  newLocation,
  deckDef,
}: MoveLabwareInterventionProps): JSX.Element | null {
  const { t: protocolSetupTranslator } = useTranslation('protocol_setup')

  // the module/labware render info needs to be 'sorted' so that the labware that is being moved comes last in the list.
  // This ensures that the labware being moved is on-top of all other svg layers and so won't have weird visual bugs
  // where it appears to slide under some labware and over others. This also means that the order in which modules/labware
  // lists are rendered also need to be dynamic based on wether the labware is nested in a module or not
  const movedLabwareIndex = labwareRenderInfo.findIndex(
    labware => labware.labwareId === movedLabwareId
  )
  if (movedLabwareIndex !== -1) {
    labwareRenderInfo.push(...labwareRenderInfo.splice(movedLabwareIndex, 1))
  } else {
    const moduleWithLabwareIndex = moduleRenderInfo.findIndex(
      module => module.nestedLabwareId === movedLabwareId
    )
    if (moduleWithLabwareIndex !== -1) {
      moduleRenderInfo.push(
        ...moduleRenderInfo.splice(moduleWithLabwareIndex, 1)
      )
    }
  }
  const movedLabwareDef = labwareRenderInfo.find(l => l.labwareId === movedLabwareId)?.labwareDef
if (movedLabwareDef == null) return null
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.75rem" width="100%">
      <MoveLabwareHeader />
      <Flex gridGap={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.75rem" width="50%">
          <Flex
            flexDirection={DIRECTION_COLUMN}
            padding={SPACING.spacing4}
            backgroundColor={COLORS.fundamentalsBackground}
            borderRadius={BORDERS.radiusSoftCorners}
          >
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginBottom={SPACING.spacing2}
            >
              {protocolSetupTranslator('labware_name')}
            </StyledText>
            <StyledText as="p">{labwareName}</StyledText>
            <Divider marginY={SPACING.spacing8} />
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginBottom={SPACING.spacing2}
            >
              {protocolSetupTranslator('labware_location')}
            </StyledText>
            <StyledText as="p">
              {oldDisplayLocation} &rarr; {newDisplayLocation}
            </StyledText>
          </Flex>
        </Flex>
        <Flex width="50%">
          <Box margin="0 auto" width="100%">
            <MoveLabwareOnDeck 
              robotType={robotType}
              initialLabwareLocation={oldLocation}
              finalLabwareLocation={newLocation}
              movedLabwareDef={movedLabwareDef}
              moduleInfoById={{}}
            />
            {/* <RobotWorkSpace
              deckDef={deckDef}
              deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
              id="InterventionModal_deckMap"
              animateDeckDependantEvent={
                newDisplayLocation === 'offDeck' ? 'move' : 'splash'
              }
            >
              {() => (
                <>
                  {movedLabwareIndex !== -1
                    ? [
                        ...getModuleRenderComponents(
                          moduleRenderInfo,
                          movedLabwareId,
                          labwareAnimationParams
                        ),
                        ...getLabwareRenderComponents(
                          labwareRenderInfo,
                          movedLabwareId,
                          labwareAnimationParams
                        ),
                      ]
                    : [
                        ...getLabwareRenderComponents(
                          labwareRenderInfo,
                          movedLabwareId,
                          labwareAnimationParams
                        ),
                        ...getModuleRenderComponents(
                          moduleRenderInfo,
                          movedLabwareId,
                          labwareAnimationParams
                        ),
                      ]}
                </>
              )}
            </RobotWorkSpace> */}
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}

function MoveLabwareHeader(): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Flex alignItems={ALIGN_CENTER} gridGap="0.75rem">
      <Icon
        name="move-xy-circle"
        size={SPACING.spacing32}
        flex="0 0 auto"
        color={COLORS.successEnabled}
      />
      <StyledText as="h1">{t('move_labware')}</StyledText>
    </Flex>
  )
}
