import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'
import { MICRO_LITERS, RunTimeCommand } from '@opentrons/shared-data'
import { BackButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { useMostRecentCompletedAnalysis } from '../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ContinueButton } from '../ProtocolSetupModules'
import { getTotalVolumePerLiquidId } from '../Devices/ProtocolRun/SetupLiquids/utils'
import { LiquidDetails } from './LiquidDetails'
import type { ParsedLiquid } from '@opentrons/api-client'
import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'

export interface ProtocolSetupLiquidsProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
}

export function ProtocolSetupLiquids({
  runId,
  setSetupScreen,
}: ProtocolSetupLiquidsProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const protocolData = useMostRecentCompletedAnalysis(runId)
  const liquidsInLoadOrder = parseLiquidsInLoadOrder(
    protocolData?.liquids ?? [],
    protocolData?.commands ?? []
  )
  return (
    <>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <BackButton onClick={() => setSetupScreen('prepare to run')}>
          {t('liquids')}
        </BackButton>
        <Flex gridGap={SPACING.spacingXXL}>
          {/* TODO(jr, 3/21/23):  wire up this */}
          <ContinueButton onClick={() => console.log('run!')} />
        </Flex>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
        marginTop="2.375rem"
      >
        {liquidsInLoadOrder?.map(liquid => (
          <React.Fragment key={liquid.id}>
            <LiquidsList
              liquid={liquid}
              commands={protocolData?.commands}
              runId={runId}
            />
          </React.Fragment>
        ))}
      </Flex>
    </>
  )
}

interface LiquidsListProps {
  liquid: ParsedLiquid
  runId: string
  commands?: RunTimeCommand[]
}

export function LiquidsList(props: LiquidsListProps): JSX.Element {
  const { liquid, runId, commands } = props
  const [openItem, setOpenItem] = React.useState(false)
  const labwareByLiquidId = parseLabwareInfoByLiquidId(commands ?? [])

  return (
    <Flex
      backgroundColor={COLORS.light_one}
      borderRadius={BORDERS.size_four}
      fontSize={TYPOGRAPHY.fontSize22}
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing5}
      width="100%"
    >
      <Flex
        alignItems={ALIGN_CENTER}
        width="100%"
        gridGap={SPACING.spacing4}
        onClick={() => setOpenItem(prevOpenItem => !prevOpenItem)}
        aria-label={`Liquids_${liquid.id}`}
      >
        <Flex
          borderRadius={BORDERS.size_two}
          padding={SPACING.spacing4}
          backgroundColor={COLORS.white}
          height="3.75rem"
          width="3.75rem"
          marginRight={SPACING.spacing4}
        >
          <Icon
            name="circle"
            color={liquid.displayColor}
            aria-label={`Liquids_${liquid.displayColor}`}
            size="1.75rem"
          />
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={TYPOGRAPHY.textAlignCenter}
        >
          <StyledText
            lineHeight={TYPOGRAPHY.lineHeight28}
            fontSize="1.375rem"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
          >
            {liquid.displayName}
          </StyledText>
        </Flex>
        <Flex justifyContent={JUSTIFY_FLEX_END} flex="1">
          <Flex
            backgroundColor={COLORS.darkBlack_twenty}
            borderRadius={BORDERS.radiusSoftCorners}
            height="2.75rem"
            padding={`${SPACING.spacing3} 0.75rem`}
            alignItems={TYPOGRAPHY.textAlignCenter}
            marginRight={SPACING.spacing3}
          >
            {getTotalVolumePerLiquidId(liquid.id, labwareByLiquidId)}{' '}
            {MICRO_LITERS}
          </Flex>
        </Flex>
        <Icon name={openItem ? 'chevron-up' : 'chevron-right'} size="3rem" />
      </Flex>
      {openItem ? (
        <LiquidDetails
          runId={runId}
          liquid={liquid}
          commands={commands}
          labwareByLiquidId={labwareByLiquidId}
        />
      ) : null}
    </Flex>
  )
}
