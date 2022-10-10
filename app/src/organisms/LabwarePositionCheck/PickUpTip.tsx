import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import { CompletedProtocolAnalysis, getIsTiprack, getLabwareDefURI, getLabwareDisplayName, getModuleDisplayName } from '@opentrons/shared-data'
import { getLabwareDefinitionsFromCommands } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'
import { TipConfirmation } from './TipConfirmation'

import type { PickUpTipStep } from './types'

interface PickUpTipProps extends PickUpTipStep {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
}
export const PickUpTip = (props: PickUpTipProps): JSX.Element | null => {
  const { t } = useTranslation('labware_position_check')
  const { labwareId, pipetteId, location, protocolData, proceed } = props
  const [showTipConfirmation, setShowTipConfirmation] = React.useState(false)
  const [hasPreparedSpace, setHasPreparedSpace] = React.useState(false)
  React.useEffect(() => {
    setHasPreparedSpace(false)
  }, [labwareId, pipetteId, location?.moduleId, location?.slotName])

  if (protocolData == null) return null
  const labwareDefUri = protocolData.labware.find(l => l.id === labwareId)
    ?.definitionUri
  const labwareDefinitions = getLabwareDefinitionsFromCommands(
    protocolData.commands
  )
  const labwareDef = labwareDefinitions.find(
    def => getLabwareDefURI(def) === labwareDefUri
  )
  if (labwareDef == null) return null

  const displayLocation = t('slot_name', { slotName: 'slotName' in location ? location?.slotName : ''})
  const labwareDisplayName = getLabwareDisplayName(labwareDef)

  let instructions = [
    t('clear_all_slots'),
    <Trans
      t={t}
      i18nKey='place_a_full_tip_rack_in_location'
      tOptions={{ tip_rack: labwareDisplayName, location: displayLocation }}
      components={{ bold: <StyledText as="span" fontWeight={TYPOGRAPHY.fontWeightSemiBold} /> }} />
  ]

  return showTipConfirmation ?
    <TipConfirmation
      invalidateTip={() => {
        setShowTipConfirmation(false)
        setHasPreparedSpace(true)
      }}
      confirmTip={proceed}
    />
    : (
      <Flex flexDirection={DIRECTION_COLUMN}>
        {hasPreparedSpace ? (
          <JogToWell
            {...props}
            header={t('check_item_in_location', {
              item: t('tip_rack'),
              location: displayLocation,
            })}
            body={<StyledText as="p">{t('ensure_nozzle_is_above_tip')}</StyledText>}
            labwareDef={labwareDef}
            proceed={() => setShowTipConfirmation(true)}
            goBack={() => setHasPreparedSpace(false)} />
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
