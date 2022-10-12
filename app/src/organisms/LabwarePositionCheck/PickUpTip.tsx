import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { StyledText } from '../../atoms/text'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import { CompletedProtocolAnalysis, getIsTiprack, getLabwareDefURI, getLabwareDisplayName, getModuleDisplayName } from '@opentrons/shared-data'
import { getLabwareDef } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'
import { TipConfirmation } from './TipConfirmation'

import type { Jog } from '../../molecules/DeprecatedJogControls/types'
import type { PickUpTipStep, RegisterPositionAction, CreateRunCommand } from './types'

interface PickUpTipProps extends PickUpTipStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  registerPosition: React.Dispatch<RegisterPositionAction>
  createRunCommand: CreateRunCommand
  handleJog: Jog
}
export const PickUpTip = (props: PickUpTipProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const { labwareId, pipetteId, location, protocolData, proceed, createRunCommand, registerPosition, handleJog } = props
  const [showTipConfirmation, setShowTipConfirmation] = React.useState(false)
  const [hasPreparedSpace, setHasPreparedSpace] = React.useState(false)
  React.useEffect(() => {
    setHasPreparedSpace(false)
  }, [labwareId, pipetteId, location?.moduleId, location?.slotName])

  const labwareDef = getLabwareDef(labwareId, protocolData)
  const pipetteName = protocolData.pipettes.find(p => p.id === pipetteId)?.pipetteName ?? null
  if (pipetteName == null || labwareDef == null) return null

  const displayLocation = t('slot_name', { slotName: 'slotName' in location ? location?.slotName : '' })
  const labwareDisplayName = getLabwareDisplayName(labwareDef)

  let instructions = [
    t('clear_all_slots'),
    <Trans
      t={t}
      i18nKey='place_a_full_tip_rack_in_location'
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{ bold: <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} /> }} />
  ]

  const handleConfirmPosition = () => {
    createRunCommand({
      command: { commandType: 'savePosition', params: { pipetteId } },
      waitUntilComplete: true,
    }).then(response => {
      const { position } = response.data.result
      registerPosition({ type: 'tipPickUpPosition', labwareId, location, position })
      proceed()
    }).catch((e: Error) => {
      console.error(`error saving position: ${e.message}`)
    })
  }

  return showTipConfirmation ?
    <TipConfirmation
      invalidateTip={() => {
        setShowTipConfirmation(false)
        setHasPreparedSpace(true)
      }}
      confirmTip={handleConfirmPosition}
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
            handleConfirmPosition={() => setShowTipConfirmation(true)}
            handleGoBack={() => setHasPreparedSpace(false)}
            handleJog={handleJog} />
        ) : (
          <PrepareSpace
            {...props}
            header={t('prepare_item_in_location', {
              item: t('tip_rack'),
              location: displayLocation,
            })}
            body={<UnorderedList items={instructions} />}
            labwareDef={labwareDef}
            confirmPlacement={() => setHasPreparedSpace(true)} />
        )}
      </Flex>
    )
}
