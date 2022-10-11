import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import { CompletedProtocolAnalysis, getIsTiprack, getLabwareDisplayName, getModuleDisplayName } from '@opentrons/shared-data'
import { getLabwareDef } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'

import type { CheckTipRacksStep, CreateRunCommand } from './types'

interface CheckItemProps extends Omit<CheckTipRacksStep, 'section'> {
  section: 'CHECK_LABWARE' | 'CHECK_TIP_RACKS'
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  createRunCommand: CreateRunCommand
}
export const CheckItem = (props: CheckItemProps): JSX.Element | null => {
  const { labwareId, pipetteId, location, protocolData, createRunCommand } = props
  const startingPosition = React.useRef(null)
  const { t } = useTranslation('labware_position_check')
  console.log('startingPosition', startingPosition.current)
  const labwareDef = getLabwareDef(labwareId, protocolData)
  if (labwareDef == null) return null
  const isTiprack = getIsTiprack(labwareDef)

  const displayLocation = 'moduleId' in location
    ? getModuleDisplayName(protocolData.modules.find(m => m.id === location.moduleId)?.model)
    : t('slot_name', { slotName: location.slotName })
  const labwareDisplayName = getLabwareDisplayName(labwareDef)
  const placeItemInstruction = isTiprack
    ? <Trans
      t={t}
      i18nKey='place_a_full_tip_rack_in_location'
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{ bold: <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} /> }} />
    : <Trans
      t={t}
      i18nKey='place_labware_in_location'
      tOptions={{ labware: labwareDisplayName, location: displayLocation }}
      components={{ bold: <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} /> }} />

  let instructions = [
    t('place_modules'),
    t('clear_all_slots'),
    placeItemInstruction,
  ]

  const handleConfirmPlacement = () => {
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
    })
      .then(_response => {
        createRunCommand({
          command: { commandType: 'savePosition', params: { pipetteId } },
          waitUntilComplete: true,
        }).then(response => {
          const { position } = response.data.result
          console.log('position ', position)
          startingPosition.current = position
        })
      })
      .catch((e: Error) => {
        console.error(`error saving position: ${e.message}`)
      })
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {startingPosition.current != null ? (
        <JogToWell
          {...props}
          header={t('check_item_in_location', {
            item: isTiprack ? t('tip_rack') : t('labware'),
            location: displayLocation,
          })}
          body={
            <StyledText as="p">
              {isTiprack ? t('ensure_nozzle_is_above_tip') : t('ensure_tip_is_above_well')}
            </StyledText>
          }
          labwareDef={labwareDef}
          goBack={() => startingPosition.current = null} />
      ) : (
        <PrepareSpace
          {...props}
          header={t('prepare_item_in_location', {
            item: isTiprack ? t('tip_rack') : t('labware'),
            location: displayLocation,
          })}
          body={<UnorderedList items={instructions} />}
          labwareDef={labwareDef}
          confirmPlacement={handleConfirmPlacement} />
      )}
    </Flex>
  )
}
