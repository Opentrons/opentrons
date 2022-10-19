import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { RobotMotionLoader } from './RobotMotionLoader'
import { PrepareSpace } from './PrepareSpace'
import {
  CompletedProtocolAnalysis,
  CreateCommand,
  getLabwareDisplayName,
  getModuleType,
} from '@opentrons/shared-data'
import { getLabwareDef } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'

import type { CreateRunCommand, ReturnTipStep } from './types'
import { VectorOffset } from '@opentrons/api-client'
import { getDisplayLocation } from './utils/getDisplayLocation'
import { chainRunCommands } from './utils/chainRunCommands'

interface ReturnTipProps extends ReturnTipStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  createRunCommand: CreateRunCommand
  tipPickUpOffset: VectorOffset | null
  isRobotMoving: boolean
}
export const ReturnTip = (props: ReturnTipProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const {
    pipetteId,
    labwareId,
    location,
    protocolData,
    proceed,
    tipPickUpOffset,
    isRobotMoving,
    createRunCommand,
  } = props

  const labwareDef = getLabwareDef(labwareId, protocolData)
  if (labwareDef == null) return null

  const displayLocation = getDisplayLocation(location, t)
  const labwareDisplayName = getLabwareDisplayName(labwareDef)

  const instructions = [
    t('clear_all_slots'),
    <Trans
      key="place_previous_tip_rack_in_location"
      t={t}
      i18nKey="place_previous_tip_rack_in_location"
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{
        bold: (
          <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} />
        ),
      }}
    />,
  ]

  const handleConfirmPlacement = (): void => {
    const modulePrepCommands = protocolData.modules.reduce<CreateCommand[]>((acc, module) => {
      if (getModuleType(module.model)) {
        return [...acc, {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: module.id },
        }]
      }
      return acc
    }, [])
    chainRunCommands([
      ...modulePrepCommands,
      {
        commandType: 'moveLabware' as const,
        params: { labwareId: labwareId, newLocation: location },
      },
      {
        commandType: 'moveToWell' as const,
        params: {
          pipetteId: pipetteId,
          labwareId: labwareId,
          wellName: 'A1',
          wellLocation: { origin: 'top' as const, offset: tipPickUpOffset ?? undefined },
        },
      },
      {
        commandType: 'dropTip' as const,
        params: {
          pipetteId: pipetteId,
          labwareId: labwareId,
          wellName: 'A1',
          wellLocation: { offset: tipPickUpOffset ?? undefined },
        },
      },
      {
        commandType: 'moveLabware' as const,
        params: { labwareId: labwareId, newLocation: 'offDeck' },
      },
      { commandType: 'home' as const, params: {} }
    ],
      createRunCommand,
      proceed
    )
  }

  if (isRobotMoving) return <RobotMotionLoader />
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <PrepareSpace
        {...props}
        header={t('prepare_item_in_location', {
          item: t('tip_rack'),
          location: displayLocation,
        })}
        body={<UnorderedList items={instructions} />}
        labwareDef={labwareDef}
        confirmPlacement={handleConfirmPlacement}
      />
    </Flex>
  )
}
