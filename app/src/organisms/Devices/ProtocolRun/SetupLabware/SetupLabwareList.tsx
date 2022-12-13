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
import { OffDeckLabwareList } from './OffDeckLabwareList'

import type { ModuleTypesThatRequireExtraAttention } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
import type { ModuleRenderInfoForProtocol } from '../../hooks'

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: 6fr 5fr;
  grip-gap: ${SPACING.spacing3};
  padding: ${SPACING.spacing3};
`
interface SetupLabwareListProps {
  attachedModuleInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
  commands: RunTimeCommand[]
  extraAttentionModules: ModuleTypesThatRequireExtraAttention[]
  isOt3: boolean
}
export function SetupLabwareList(
  props: SetupLabwareListProps
): JSX.Element | null {
  const { attachedModuleInfo, commands, extraAttentionModules, isOt3 } = props
  const { t } = useTranslation('protocol_setup')
  const { offDeckItems, onDeckItems } = getLabwareSetupItemGroups(commands)

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing2}
      marginBottom={SPACING.spacing4}
    >
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
          isOt3={isOt3}
        />
      ))}
      <OffDeckLabwareList labwareItems={offDeckItems} isOt3={isOt3} />
    </Flex>
  )
}
