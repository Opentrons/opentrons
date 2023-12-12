import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
} from '@opentrons/components'
import { RunTimeCommand } from '@opentrons/shared-data'
import { StyledText } from '../../../../atoms/text'
import { getLabwareSetupItemGroups } from '../../../../pages/Protocols/utils'
import { LabwareListItem } from './LabwareListItem'
import { OffDeckLabwareList } from './OffDeckLabwareList'
import { getNestedLabwareInfo } from './getNestedLabwareInfo'

import type { ModuleRenderInfoForProtocol } from '../../hooks'
import type { ModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 5.2fr 5.3fr;
  grip-gap: ${SPACING.spacing8};
  padding: ${SPACING.spacing8};
`
interface SetupLabwareListProps {
  attachedModuleInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
  commands: RunTimeCommand[]
  extraAttentionModules: ModuleTypesThatRequireExtraAttention[]
  isFlex: boolean
}
export function SetupLabwareList(
  props: SetupLabwareListProps
): JSX.Element | null {
  const { attachedModuleInfo, commands, extraAttentionModules, isFlex } = props
  const { t } = useTranslation('protocol_setup')
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(commands)

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      marginBottom={SPACING.spacing16}
    >
      <HeaderRow>
        <StyledText as="label" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('location')}
        </StyledText>
        <StyledText as="label" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('labware_name')}
        </StyledText>
        <StyledText as="label" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('placement')}
        </StyledText>
      </HeaderRow>
      {onDeckItems.map((labwareItem, index) => {
        const labwareOnAdapter = onDeckItems.find(
          item =>
            labwareItem.initialLocation !== 'offDeck' &&
            'labwareId' in labwareItem.initialLocation &&
            item.labwareId === labwareItem.initialLocation.labwareId
        )
        return labwareOnAdapter != null ? null : (
          <LabwareListItem
            commands={commands}
            key={index}
            attachedModuleInfo={attachedModuleInfo}
            extraAttentionModules={extraAttentionModules}
            {...labwareItem}
            isFlex={isFlex}
            nestedLabwareInfo={getNestedLabwareInfo(labwareItem, commands)}
          />
        )
      })}
      <OffDeckLabwareList
        commands={commands}
        labwareItems={offDeckItems}
        isFlex={isFlex}
      />
    </Flex>
  )
}
