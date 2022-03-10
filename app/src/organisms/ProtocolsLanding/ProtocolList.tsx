import * as React from 'react'
import { useTranslation } from 'react-i18next'
import first from 'lodash/first'
import {
  Box,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/Buttons'
import { Slideout } from '../../atoms/Slideout'
import { UploadInput } from './UploadInput'
import { ProtocolCard } from './ProtocolCard'
import { EmptyStateLinks } from './EmptyStateLinks'
import {
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '../../redux/modules'

import type { StoredProtocolData } from '../../redux/protocol-storage'

interface ProtocolListProps {
  storedProtocols: StoredProtocolData[]
}
export function ProtocolList(props: ProtocolListProps): JSX.Element | null {
  const [showSlideout, setShowSlideout] = React.useState(false)
  const { t } = useTranslation('protocol_info')
  const {storedProtocols} =props

  return (
    <Box padding={SPACING.spacing4}>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginBottom={SPACING.spacing5}
      >
        <StyledText as="h1">{t('protocols')}</StyledText>
        {/* TODO - Add text filter dropdown overflow menu component */}
        <SecondaryButton
          onClick={() => {
            setShowSlideout(true)
          }}
        >
          {t('import')}
        </SecondaryButton>
      </Flex>
      <StyledText as="p" paddingBottom={SPACING.spacing4}>
        {t('all_protocols')}
      </StyledText>
      <Flex flexDirection="column">
        {storedProtocols.map(storedProtocol => {
          const protocolName = first(storedProtocol.srcFileNames) ?? storedProtocol.protocolKey
          return (
            <ProtocolCard
              key={storedProtocol.protocolKey}
              protocolKey={storedProtocol.protocolKey}
              protocolName={protocolName}
              robotModel="OT-2"
              leftMountPipetteName="p300_single_gen2"
              rightMountPipetteName="p20_multi_gen2"
              requiredModuleTypes={[
                THERMOCYCLER_MODULE_TYPE,
                MAGNETIC_MODULE_TYPE,
                TEMPERATURE_MODULE_TYPE,
                HEATERSHAKER_MODULE_TYPE,
              ]}
              lastUpdated={storedProtocol.modified}
            />
          )
        })}
      </Flex>
      <EmptyStateLinks title={t('create_or_download')} />
      <Slideout
        title={t('import_new_protocol')}
        isExpanded={showSlideout}
        onCloseClick={() => setShowSlideout(false)}
        height="100%"
      >
        <Box height="26rem">
          <UploadInput onUpload={() => setShowSlideout(false)}/>
        </Box>
      </Slideout>
    </Box>
  )
}
