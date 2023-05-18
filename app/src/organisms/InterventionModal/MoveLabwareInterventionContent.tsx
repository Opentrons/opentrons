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
} from '@opentrons/components'

import { getLabwareRenderComponents, getModuleRenderComponents } from './utils'
import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'
import { getStandardDeckViewLayerBlockList } from '../Devices/ProtocolRun/utils/getStandardDeckViewLayerBlockList'

import type { MoveLabwareAnimationParams } from '@opentrons/components'
import type { DeckDefinition, RobotType } from '@opentrons/shared-data'
import type { RunLabwareInfo, RunModuleInfo } from './utils'

export interface MoveLabwareInterventionProps {
  robotType: RobotType
  moduleRenderInfo: RunModuleInfo[]
  labwareRenderInfo: RunLabwareInfo[]
  labwareAnimationParams: MoveLabwareAnimationParams
  labwareName: string
  movedLabwareId: string
  oldDisplayLocation: string
  newDisplayLocation: string
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
  deckDef,
}: MoveLabwareInterventionProps): JSX.Element {
  const { t: protocolSetupTranslator } = useTranslation('protocol_setup')

  // the module/labware render info needs to be 'sorted' so that the labware that is being moved comes last in the list
  // this ensures that the labware being moved is on-top of all other svg layers and so won't have weird visual bugs
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

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.75rem" width="100%">
      <MoveLabwareHeader />
      <Flex gridGap={SPACING.spacing6}>
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
            <Divider marginY={SPACING.spacing3} />
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
            <RobotWorkSpace
              deckDef={deckDef}
              deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
              id="InterventionModal_deckMap"
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
            </RobotWorkSpace>
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
        size={SPACING.spacing6}
        flex="0 0 auto"
        color={COLORS.successEnabled}
      />
      <StyledText as="h1">{t('move_labware')}</StyledText>
    </Flex>
  )
}
