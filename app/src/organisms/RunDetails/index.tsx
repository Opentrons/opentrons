import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { useProtocolDetails } from './hooks'


export function RunDetails(): JSX.Element {
  const { t } = useTranslation('run_details')
  const {displayName, protocolData} = useProtocolDetails()

  const titleBarProps = { title: t('protocol_title', { protocol_name: displayName}) }

  return (
    <Page titleBarProps={titleBarProps}>
      <Flex>
        {'commands' in  protocolData ? protocolData.commands.map(command => (
          <Flex>
            <Text>{command.command}</Text>
          </Flex>
        )): null}
      </Flex>
    </Page>
  )
}
