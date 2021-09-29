import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, DIRECTION_COLUMN } from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { useProtocolDetails } from './hooks'

export function RunDetails(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const { displayName, protocolData } = useProtocolDetails()
  if (protocolData == null) return null

  const titleBarProps = {
    title: t('protocol_title', { protocol_name: displayName }),
  }

  return (
    <Page titleBarProps={titleBarProps}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        {'commands' in protocolData
          ? protocolData.commands.map((command, index) => (
              <Flex key={index}>
                <Text>{command.command}</Text>
              </Flex>
            ))
          : null}
      </Flex>
    </Page>
  )
}
