import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { DIRECTION_COLUMN, Flex, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { PrepareSpace } from './PrepareSpace'
import { JogToWell } from './JogToWell'
import { CompletedProtocolAnalysis, getIsTiprack, getLabwareDefURI, getLabwareDisplayName, getModuleDisplayName } from '@opentrons/shared-data'
import { getLabwareDefinitionsFromCommands } from './utils/labware'
import { UnorderedList } from '../../molecules/UnorderedList'

import type { CheckTipRacksStep } from './types'

interface CheckItemProps extends Omit<CheckTipRacksStep, 'section'> {
  section: 'CHECK_LABWARE' | 'CHECK_TIP_RACKS'
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
}
export const CheckItem = (props: CheckItemProps): JSX.Element | null => {
  const { labwareId, pipetteId, location, protocolData } = props
  const [hasPreparedSpace, setHasPreparedSpace] = React.useState(false)
  const { t } = useTranslation('labware_position_check')
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

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {hasPreparedSpace ? (
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
          goBack={() => setHasPreparedSpace(false)} />
      ) : (
        <PrepareSpace
          {...props}
          header={t('prepare_item_in_location', {
            item: isTiprack ? t('tip_rack') : t('labware'),
            location: displayLocation,
          })}
          body={<UnorderedList items={instructions} />}
          labwareDef={labwareDef}
          confirmPlacement={() => setHasPreparedSpace(true)} />
      )}
    </Flex>
  )
}
