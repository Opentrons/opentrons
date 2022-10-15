import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { RobotMotionLoader } from './RobotMotionLoader'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import { CompletedProtocolAnalysis, FIXED_TRASH_ID, getLabwareDefURI, getLabwareDisplayName, IDENTITY_VECTOR } from '@opentrons/shared-data'
import { getLabwareDef } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'
import { getCurrentOffsetForLabwareInLocation } from '../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { TipConfirmation } from './TipConfirmation'

import type { Jog } from '../../molecules/DeprecatedJogControls/types'
import type { PickUpTipStep, RegisterPositionAction, CreateRunCommand, WorkingOffset } from './types'
import type { LabwareOffset, VectorOffset } from '@opentrons/api-client'

interface PickUpTipProps extends PickUpTipStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  registerPosition: React.Dispatch<RegisterPositionAction>
  createRunCommand: CreateRunCommand
  workingOffsets: WorkingOffset[]
  existingOffsets: LabwareOffset[]
  tipPickUpPosition: VectorOffset | null
  handleJog: Jog
  isRobotMoving: boolean
}
export const PickUpTip = (props: PickUpTipProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const { labwareId, pipetteId, location, protocolData, proceed, createRunCommand, registerPosition, handleJog, isRobotMoving, existingOffsets, tipPickUpPosition } = props
  const [showTipConfirmation, setShowTipConfirmation] = React.useState(false)
  const [hasPreparedSpace, setHasPreparedSpace] = React.useState(false)

  const labwareDef = getLabwareDef(labwareId, protocolData)
  const pipetteName = protocolData.pipettes.find(p => p.id === pipetteId)?.pipetteName ?? null
  if (pipetteName == null || labwareDef == null) return null

  const displayLocation = t('slot_name', { slotName: 'slotName' in location ? location?.slotName : '' })
  const labwareDisplayName = getLabwareDisplayName(labwareDef)

  const instructions = [
    t('clear_all_slots'),
    <Trans
      key='place_a_full_tip_rack_in_location'
      t={t}
      i18nKey='place_a_full_tip_rack_in_location'
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{ bold: <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} /> }} />
  ]

  const handleConfirmPlacement = (): void => {
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
            commandType: 'moveToWell' as const,
            params: {
              pipetteId: pipetteId,
              labwareId: labwareId,
              wellName: 'A1',
              wellLocation: { origin: 'top' as const },
            },
          },
          waitUntilComplete: true,
        }, {
          onSuccess: () => {
            console.log('COMPLETE ON SUCCESS BEFORE SET')
            setHasPreparedSpace(true)
          }
        }).catch((e: Error) => {
          console.error(`error moving to tip rack ${e.message}`)
        })
      }
    })
  }
  const handleConfirmPosition = (): void => {
    createRunCommand({
      command: { commandType: 'savePosition', params: { pipetteId } },
      waitUntilComplete: true,
    }, {
      onSuccess: () => {
        createRunCommand({
          command: {
            commandType: 'pickUpTip',
            params: {
              pipetteId,
              labwareId,
              wellName: 'A1',
            }
          },
          waitUntilComplete: true,
        }, {
          onSuccess: () => {
            setShowTipConfirmation(true)
          }
        })
      }
    })
  }

  const handleConfirmTipAttached = (): void => {
    createRunCommand({
      command: { commandType: 'savePosition', params: { pipetteId } },
      waitUntilComplete: true,
    }).then(response => {
      const { position } = response.data.result
      registerPosition({ type: 'tipPickUpPosition', labwareId, location, position })
      createRunCommand({
        command: {
          commandType: 'moveLabware' as const,
          params: { labwareId: labwareId, newLocation: 'offDeck' },
        },
        waitUntilComplete: true,
      }).then(_moveResponse => {
        createRunCommand({
          command: {
            commandType: 'moveToWell' as const,
            params: {
              pipetteId: pipetteId,
              labwareId: FIXED_TRASH_ID,
              wellName: 'A1',
              wellLocation: { origin: 'top' as const },
            },
          },
          waitUntilComplete: true,
        }).then(_homeResponse => {
          proceed()
        })
      }).catch((e: Error) => {
        console.error(`error saving position: ${e.message}`)
      })
    })
  }
  const handleInvalidateTip = (): void => {
    createRunCommand({
      command: {
        commandType: 'dropTip',
        params: {
          pipetteId,
          labwareId,
          wellName: 'A1',
        }
      },
      waitUntilComplete: true,
    }, {
      onSuccess: () => {
        setShowTipConfirmation(false)
        setHasPreparedSpace(true)
      }
    })
  }
  const existingOffset = getCurrentOffsetForLabwareInLocation(existingOffsets, getLabwareDefURI(labwareDef), location)?.vector ?? IDENTITY_VECTOR

  if (isRobotMoving) return <RobotMotionLoader />
  return showTipConfirmation ?
    <TipConfirmation
      invalidateTip={handleInvalidateTip}
      confirmTip={handleConfirmTipAttached}
    />
    : (
      <Flex flexDirection={DIRECTION_COLUMN}>
        {hasPreparedSpace ? (
          <JogToWell
            header={t('pick_up_tip_from_rack_in_location', {
              location: displayLocation,
            })}
            body={<StyledText as="p">{t('ensure_nozzle_is_above_tip')}</StyledText>}
            labwareDef={labwareDef}
            pipetteName={pipetteName}
            handleConfirmPosition={handleConfirmPosition}
            handleGoBack={() => setHasPreparedSpace(false)}
            handleJog={handleJog}
            initialPosition={IDENTITY_VECTOR}
            existingOffset={existingOffset}
            showLiveOffset={false} />
        ) : (
          <PrepareSpace
            {...props}
            header={t('prepare_item_in_location', {
              item: t('tip_rack'),
              location: displayLocation,
            })}
            body={<UnorderedList items={instructions} />}
            labwareDef={labwareDef}
            confirmPlacement={handleConfirmPlacement} />
        )}
      </Flex>
    )
}
