import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  TYPOGRAPHY,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useCurrentRun } from '../../ProtocolUpload/hooks'
import { NeedHelpLink } from '../../CalibrationPanels'
import { PrimaryButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import { getPrepCommands } from './getPrepCommands'
import { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import type { CreateRunCommand, RegisterPositionAction } from '../types'
import type { Jog } from '../../../molecules/JogControls'

export const INTERVAL_MS = 3000

export const IntroScreen = (props: {
  proceed: () => void
  protocolData: CompletedProtocolAnalysis
  registerPosition: React.Dispatch<RegisterPositionAction>
  createRunCommand: CreateRunCommand
  handleJog: Jog
}): JSX.Element | null => {
  const { proceed, protocolData, createRunCommand } = props
  const { t } = useTranslation(['labware_position_check', 'shared'])

  const handleClickStartLPC = (): void => {
    const prepCommands = getPrepCommands(protocolData?.commands ?? [])
    Promise.all(
      prepCommands.map(command =>
        createRunCommand({command}).catch((e: Error) => {
          console.error(`error issuing command to robot: ${e.message}`)
        })
      )
    ).then(() => {
      proceed()
    })
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <Flex gridGap={SPACING.spacingXXL}>
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing3}
        >
          <StyledText as="h1" marginBottom={SPACING.spacing4}>
            {t('shared:before_you_begin')}
          </StyledText>
          <Trans
            t={t}
            i18nKey="labware_position_check_description"
            components={{ block: <StyledText as="p" /> }} />
        </Flex>
        <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
          <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {t('shared:you_will_need')}
          </StyledText>
          <StyledText as="p">{t('all_modules_and_labware_from_protocol')}</StyledText>
        </Flex>
      </Flex>
      <Flex
        width="100%"
        marginTop={SPACING.spacing6}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink />
        <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3}>
          <PrimaryButton onClick={handleClickStartLPC}>{t('shared:get_started')}</PrimaryButton>
        </Flex>
      </Flex>
    </Flex >
  )
}
