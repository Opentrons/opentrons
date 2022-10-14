import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { StyledText } from '../../atoms/text'
import { LoadingState } from '../CalibrationPanels/LoadingState'
import { PrepareSpace } from './PrepareSpace'
import { CompletedProtocolAnalysis, getLabwareDisplayName } from '@opentrons/shared-data'
import { getLabwareDef } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'

import type { CreateRunCommand, ReturnTipStep } from './types'
import { VectorOffset } from '@opentrons/api-client'

interface ReturnTipProps extends ReturnTipStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  createRunCommand: CreateRunCommand
  tipPickUpPosition: VectorOffset | null
  isRobotMoving: boolean
}
export const ReturnTip = (props: ReturnTipProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const { pipetteId, labwareId, location, protocolData, proceed, tipPickUpPosition, isRobotMoving, createRunCommand } = props

  const labwareDef = getLabwareDef(labwareId, protocolData)
  if (labwareDef == null) return null

  const displayLocation = t('slot_name', { slotName: 'slotName' in location ? location?.slotName : '' })
  const labwareDisplayName = getLabwareDisplayName(labwareDef)

  let instructions = [
    t('clear_all_slots'),
    <Trans
      t={t}
      i18nKey='place_previous_tip_rack_in_location'
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{ bold: <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} /> }} />
  ]

  const handleConfirmPlacement = () => {
    createRunCommand({
      command: {
        commandType: 'moveLabware' as const,
        params: { labwareId: labwareId, newLocation: location },
      },
      waitUntilComplete: true,
    }, {
      onSuccess: () => {
        createRunCommand({
          command: {
            commandType: 'dropTip' as const,
            params: { pipetteId: pipetteId, labwareId: labwareId, wellName: 'A1' },
          },
          waitUntilComplete: true,
        }, {
          onSuccess: () => {
            console.log('COMPLETE ON SUCCESS BEFORE SET')
            proceed()
          }
        }).catch((e: Error) => {
          console.error(`error dropping tip ${e.message}`)
        })
      }
    })
  }

  if (isRobotMoving) return <LoadingState />
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
        confirmPlacement={handleConfirmPlacement} />
    </Flex>
  )
}
