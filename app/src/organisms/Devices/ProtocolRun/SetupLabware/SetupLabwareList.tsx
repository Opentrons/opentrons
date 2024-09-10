import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  COLORS,
} from '@opentrons/components'
import { getLabwareSetupItemGroups } from '../../../../pages/Desktop/Protocols/utils'
import { LabwareListItem } from './LabwareListItem'
import { getNestedLabwareInfo } from './getNestedLabwareInfo'

import type { RunTimeCommand } from '@opentrons/shared-data'
import type { ModuleRenderInfoForProtocol } from '../../hooks'
import type { ModuleTypesThatRequireExtraAttention } from '../utils/getModuleTypesThatRequireExtraAttention'
import type { LabwareSetupItem } from '../../../../pages/Desktop/Protocols/utils'

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
  const allItems: LabwareSetupItem[] = []
  allItems.push.apply(allItems, onDeckItems)
  allItems.push.apply(allItems, offDeckItems)

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      marginBottom={SPACING.spacing16}
    >
      <Flex
        gridGap={SPACING.spacing16}
        paddingLeft={SPACING.spacing24}
        paddingTop={SPACING.spacing20}
      >
        <StyledText
          width="5rem"
          desktopStyle="bodyDefaultRegular"
          color={COLORS.grey60}
        >
          {t('location')}
        </StyledText>
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t('labware_name')}
        </StyledText>
      </Flex>
      {allItems.map((labwareItem, index) => {
        const labwareOnAdapter = allItems.find(
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
    </Flex>
  )
}
