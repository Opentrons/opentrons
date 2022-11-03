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
import { getLabwareSetupItemGroups } from './utils'
import { LabwareListItem } from './LabwareListItem'

import type { ModuleTypesThatRequireExtraAttention } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
import type { ModuleRenderInfoForProtocol } from '../../hooks'
import { OffDeckLabwareList } from './OffDeckLabwareList'

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 6fr 5fr;
  grip-gap: ${SPACING.spacing3};
  padding: ${SPACING.spacing4};
`
interface SetupLabwareListProps {
  attachedModuleInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
  commands: RunTimeCommand[]
  extraAttentionModules: ModuleTypesThatRequireExtraAttention[]
}
export function SetupLabwareList(
  props: SetupLabwareListProps
): JSX.Element | null {
  const { attachedModuleInfo, commands, extraAttentionModules } = props
  const { t } = useTranslation('protocol_setup')
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(commands)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
      <HeaderRow>
        <StyledText as="label" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('labware_name')}
        </StyledText>
        <StyledText as="label" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('initial_location')}
        </StyledText>
      </HeaderRow>
      {onDeckItems.map((labwareItem, index) => (
        <LabwareListItem
          key={index}
          attachedModuleInfo={attachedModuleInfo}
          extraAttentionModules={extraAttentionModules}
          {...labwareItem}
        />
      ))}
      <OffDeckLabwareList labwareItems={offDeckItems} />
    </Flex>
  )
}
