import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Text,
  Flex,
  Box,
  TYPOGRAPHY,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { useCurrentRun } from '../../ProtocolUpload/hooks'
import { PrimaryButton } from '../../../atoms/buttons'
import { getPrepCommands } from './getPrepCommands'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import { useCreateCommandMutation } from '@opentrons/react-api-client'

export const INTERVAL_MS = 3000

export const IntroScreen = (props: {
  proceed: () => void
  protocolData: CompletedProtocolAnalysis
}): JSX.Element | null => {
  const { proceed, protocolData } = props


  const runRecord = useCurrentRun()
  const { createCommand } = useCreateCommandMutation()
  const { t } = useTranslation(['labware_position_check', 'shared'])

  if (runRecord == null) return null

  const handleClickStartLPC = (): void => {
    const prepCommands = getPrepCommands(protocolData?.commands ?? [])
    prepCommands.forEach(command => {
      createCommand({ runId: runRecord.data.id, command }).catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
      })
    })
    proceed()
  }

  return (
    <Box>
      <Text
        as="h3"
        textTransform={TYPOGRAPHY.textTransformUppercase}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
      >
        {t('labware_position_check_overview')}
      </Text>
      <Trans
        t={t}
        i18nKey="position_check_description"
        components={{
          block: (
            <Text fontSize={TYPOGRAPHY.fontSizeH3} />
          ),
        }}
      ></Trans>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <PrimaryButton onClick={handleClickStartLPC}>
          PROCEED
        </PrimaryButton>
      </Flex>
    </Box>
  )
}
