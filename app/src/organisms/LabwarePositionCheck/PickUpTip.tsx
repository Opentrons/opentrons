import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { RobotMotionLoader } from './RobotMotionLoader'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import {
  CompletedProtocolAnalysis,
  FIXED_TRASH_ID,
  getLabwareDefURI,
  getLabwareDisplayName,
  getVectorDifference,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'
import { getLabwareDef } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'
import { getCurrentOffsetForLabwareInLocation } from '../Devices/ProtocolRun/utils/getCurrentOffsetForLabwareInLocation'
import { TipConfirmation } from './TipConfirmation'

import type { Jog } from '../../molecules/DeprecatedJogControls/types'
import type {
  PickUpTipStep,
  RegisterPositionAction,
  CreateRunCommand,
  WorkingOffset,
} from './types'
import type { LabwareOffset, VectorOffset } from '@opentrons/api-client'
import { getDisplayLocation } from './utils/getDisplayLocation'

interface PickUpTipProps extends PickUpTipStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  registerPosition: React.Dispatch<RegisterPositionAction>
  createRunCommand: CreateRunCommand
  workingOffsets: WorkingOffset[]
  existingOffsets: LabwareOffset[]
  handleJog: Jog
  isRobotMoving: boolean
}
export const PickUpTip = (props: PickUpTipProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const {
    labwareId,
    pipetteId,
    location,
    protocolData,
    proceed,
    createRunCommand,
    registerPosition,
    handleJog,
    isRobotMoving,
    existingOffsets,
  } = props
  const [showTipConfirmation, setShowTipConfirmation] = React.useState(false)
  const [
    initialPosition,
    setInitialPosition,
  ] = React.useState<VectorOffset | null>(null)

  const labwareDef = getLabwareDef(labwareId, protocolData)
  const pipetteName =
    protocolData.pipettes.find(p => p.id === pipetteId)?.pipetteName ?? null
  if (pipetteName == null || labwareDef == null) return null

  const displayLocation = getDisplayLocation(location, t)
  const labwareDisplayName = getLabwareDisplayName(labwareDef)
  const instructions = [
    t('clear_all_slots'),
    <Trans
      key="place_a_full_tip_rack_in_location"
      t={t}
      i18nKey="place_a_full_tip_rack_in_location"
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{
        bold: (
          <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} />
        ),
      }}
    />,
  ]

  const handleConfirmPlacement = (): void => {
    createRunCommand(
      {
        command: {
          commandType: 'moveLabware' as const,
          params: { labwareId: labwareId, newLocation: location },
        },
        waitUntilComplete: true,
      },
      {
        onSuccess: () => {
          createRunCommand(
            {
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
            },
            {
              onSuccess: () => {
                createRunCommand(
                  {
                    command: {
                      commandType: 'savePosition',
                      params: { pipetteId },
                    },
                    waitUntilComplete: true,
                  },
                  {
                    onSuccess: response => {
                      const { position } = response.data.result
                      setInitialPosition(position)
                    },
                  }
                ).catch((e: Error) => {
                  console.error(`error saving position ${e.message}`)
                })
              },
            }
          ).catch((e: Error) => {
            console.error(`error moving to tip rack ${e.message}`)
          })
        },
      }
    ).catch((e: Error) => {
      console.error(`error moving labware onto deck ${e.message}`)
    })
  }
  const handleConfirmPosition = (): void => {
    createRunCommand(
      {
        command: {
          commandType: 'pickUpTip',
          params: {
            pipetteId,
            labwareId,
            wellName: 'A1',
          },
        },
        waitUntilComplete: true,
      },
      {
        onSuccess: () => {
          setShowTipConfirmation(true)
        },
      }
    ).catch((e: Error) => {
      console.error(`error picking up tip ${e.message}`)
    })
  }

  const handleConfirmTipAttached = (): void => {
    createRunCommand({
      command: { commandType: 'savePosition', params: { pipetteId } },
      waitUntilComplete: true,
    })
      .then(response => {
        const { position } = response.data.result
        const offset =
          initialPosition != null
            ? getVectorDifference(position, initialPosition)
            : position
        registerPosition({ type: 'tipPickUpOffset', offset })
        createRunCommand({
          command: {
            commandType: 'moveLabware' as const,
            params: { labwareId: labwareId, newLocation: 'offDeck' },
          },
          waitUntilComplete: true,
        })
          .then(_moveResponse => {
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
            })
              .then(_homeResponse => {
                proceed()
              })
              .catch((e: Error) => {
                console.error(`error moving to tip ${e.message}`)
              })
          })
          .catch((e: Error) => {
            console.error(`error moving labware: ${e.message}`)
          })
      })
      .catch((e: Error) => {
        console.error(`error saving position: ${e.message}`)
      })
  }
  const handleInvalidateTip = (): void => {
    createRunCommand(
      {
        command: {
          commandType: 'dropTip',
          params: {
            pipetteId,
            labwareId,
            wellName: 'A1',
          },
        },
        waitUntilComplete: true,
      },
      {
        onSuccess: () => {
          setShowTipConfirmation(false)
          setInitialPosition(null)
        },
      }
    ).catch((e: Error) => {
      console.error(`error dropping tip: ${e.message}`)
    })
  }
  const existingOffset =
    getCurrentOffsetForLabwareInLocation(
      existingOffsets,
      getLabwareDefURI(labwareDef),
      location
    )?.vector ?? IDENTITY_VECTOR

  if (isRobotMoving) return <RobotMotionLoader />
  return showTipConfirmation ? (
    <TipConfirmation
      invalidateTip={handleInvalidateTip}
      confirmTip={handleConfirmTipAttached}
    />
  ) : (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {initialPosition != null ? (
        <JogToWell
          header={t('pick_up_tip_from_rack_in_location', {
            location: displayLocation,
          })}
          body={
            <StyledText as="p">{t('ensure_nozzle_is_above_tip')}</StyledText>
          }
          labwareDef={labwareDef}
          pipetteName={pipetteName}
          handleConfirmPosition={handleConfirmPosition}
          handleGoBack={() => setInitialPosition(null)}
          handleJog={handleJog}
          initialPosition={IDENTITY_VECTOR}
          existingOffset={existingOffset}
          showLiveOffset={false}
        />
      ) : (
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
      )}
    </Flex>
  )
}
