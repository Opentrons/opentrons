import { useTranslation } from 'react-i18next'

import { Flex, SPACING, Tabs } from '@opentrons/components'

import { useFeatureFlag } from '/app/redux/config'

import type { ReactNode } from 'react'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'

type ProtocolDetailsTab =
  'robot_config' | 'labware' | 'liquids' | 'stats' | 'parameters'

export interface ProtocolDetailsTabsProps {
  mostRecentAnalysis: ProtocolAnalysisOutput | null
  currentTab: ProtocolDetailsTab
  setCurrentTab: (tab: ProtocolDetailsTab) => void
}

export function ProtocolDetailsTabs({
  mostRecentAnalysis,
  currentTab,
  setCurrentTab,
}: ProtocolDetailsTabsProps): ReactNode {
  const { t, i18n } = useTranslation('protocol_details')
  const enableProtocolStats = useFeatureFlag('protocolStats')

  return (
    <Flex gridGap={SPACING.spacing4}>
      {mostRecentAnalysis != null && (
        <Tabs
          tabs={[
            {
              text: i18n.format(t('parameters'), 'capitalize'),
              isActive: currentTab === 'parameters',
              disabled: false,
              onClick: () => {
                setCurrentTab('parameters')
              },
            },
          ]}
        />
      )}
      <Tabs
        tabs={[
          {
            text: i18n.format(t('hardware'), 'capitalize'),
            isActive: currentTab === 'robot_config',
            disabled: false,
            onClick: () => {
              setCurrentTab('robot_config')
            },
          },
          {
            text: i18n.format(t('labware'), 'capitalize'),
            isActive: currentTab === 'labware',
            disabled: false,
            onClick: () => {
              setCurrentTab('labware')
            },
          },
        ]}
      />
      {mostRecentAnalysis != null && (
        <Tabs
          tabs={[
            {
              text: i18n.format(t('liquids'), 'capitalize'),
              isActive: currentTab === 'liquids',
              disabled: false,
              onClick: () => {
                setCurrentTab('liquids')
              },
            },
          ]}
        />
      )}
      {enableProtocolStats && mostRecentAnalysis != null && (
        <Tabs
          tabs={[
            {
              text: i18n.format(t('stats'), 'capitalize'),
              isActive: currentTab === 'stats',
              disabled: false,
              onClick: () => {
                setCurrentTab('stats')
              },
            },
          ]}
        />
      )}
    </Flex>
  )
}
