// setup modules component
import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import { getModuleDisplayName } from '@opentrons/shared-data'
import {
  Box,
  Flex,
  Text,
  FONT_SIZE_BODY_1,
  SPACING_2,
  SPACING_3,
  SPACING_AUTO,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'
import { selectors as robotSelectors } from '../../../redux/robot'

import { InfoSection } from './InfoSection'

import type { ModuleModel } from '@opentrons/shared-data'
import type { State } from '../../../redux/types'
import type { SessionModule } from '../../../redux/robot/types'

const TYPE_COL_STYLE = { marginRight: SPACING_AUTO }
const QUANTITY_COL_STYLE = { width: '37.5%', marginX: SPACING_3 }

export function ProtocolModulesCard(): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  const modules = useSelector((state: State) => {
    return robotSelectors.getModules(state)
  })

  if (modules.length < 1) return null

  const moduleDetails: { [model in ModuleModel]?: number } = modules.reduce<
    { [model in ModuleModel]?: number }
  >((total, module: SessionModule) => {
    total[module.model] = (total[module.model] || 0) + 1
    return total
  }, {})
  const modulesInfo = Object.keys(moduleDetails).map(k => {
    return { model: k as ModuleModel, counts: moduleDetails[k as ModuleModel] }
  })

  return (
    <InfoSection title={t('modules_title')}>
      <Box fontSize={FONT_SIZE_BODY_1}>
        <Flex fontWeight={FONT_WEIGHT_SEMIBOLD}>
          <Text {...TYPE_COL_STYLE}>{t('required_type_title')}</Text>
          <Text {...QUANTITY_COL_STYLE}>{t('required_quantity_title')}</Text>
        </Flex>
        {modulesInfo.map(m => (
          <Flex key={m.model} marginTop={SPACING_2}>
            <Text {...TYPE_COL_STYLE}>{getModuleDisplayName(m.model)}</Text>
            <Text {...QUANTITY_COL_STYLE}>x {m.counts}</Text>
          </Flex>
        ))}
      </Box>
    </InfoSection>
  )
}
