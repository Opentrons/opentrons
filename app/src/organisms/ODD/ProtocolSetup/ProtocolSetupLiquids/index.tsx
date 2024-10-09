import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  JUSTIFY_SPACE_BETWEEN,
  Chip,
} from '@opentrons/components'
import {
  MICRO_LITERS,
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
} from '@opentrons/shared-data'
import { ODDBackButton } from '/app/molecules/ODDBackButton'
import { SmallButton } from '/app/atoms/buttons'

import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import { getTotalVolumePerLiquidId } from '/app/transformations/analysis'
import { LiquidDetails } from './LiquidDetails'
import type { ParsedLiquid, RunTimeCommand } from '@opentrons/shared-data'
import type { SetupScreens } from '../types'

export interface ProtocolSetupLiquidsProps {
  runId: string
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  isConfirmed: boolean
  setIsConfirmed: (confirmed: boolean) => void
}

export function ProtocolSetupLiquids({
  runId,
  setSetupScreen,
  isConfirmed,
  setIsConfirmed,
}: ProtocolSetupLiquidsProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_setup')
  const protocolData = useMostRecentCompletedAnalysis(runId)
  const liquidsInLoadOrder = parseLiquidsInLoadOrder(
    protocolData?.liquids ?? [],
    protocolData?.commands ?? []
  )
  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <ODDBackButton
          label={i18n.format(t('liquids'), 'capitalize')}
          onClick={() => {
            setSetupScreen('prepare to run')
          }}
        />
        {isConfirmed ? (
          <Chip
            background
            iconName="ot-check"
            text={t('liquids_confirmed')}
            type="success"
          />
        ) : (
          <SmallButton
            buttonText={t('confirm_liquids')}
            onClick={() => {
              setIsConfirmed(true)
              setSetupScreen('prepare to run')
            }}
            buttonCategory="rounded"
          />
        )}
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        marginTop="2.375rem"
      >
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} marginRight="13rem">
          <Flex paddingLeft={SPACING.spacing16} width="10.5625rem">
            <StyledText oddStyle="smallBodyTextSemiBold" color={COLORS.grey60}>
              {t('liquid_name')}
            </StyledText>
          </Flex>
          <Flex>
            <StyledText oddStyle="smallBodyTextSemiBold" color={COLORS.grey60}>
              {t('total_liquid_volume')}
            </StyledText>
          </Flex>
        </Flex>
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
      backgroundColor={COLORS.grey35}
      borderRadius={BORDERS.borderRadius16}
      fontSize={TYPOGRAPHY.fontSize22}
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing24}
      width="100%"
    >
      <Flex
        alignItems={ALIGN_CENTER}
        width="100%"
        gridGap={SPACING.spacing16}
        onClick={() => {
          setOpenItem(prevOpenItem => !prevOpenItem)
        }}
        aria-label={`Liquids_${liquid.id}`}
      >
        <Flex
          borderRadius={BORDERS.borderRadius8}
          padding={SPACING.spacing16}
          backgroundColor={COLORS.white}
          height="3.75rem"
          width="3.75rem"
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
          <StyledText oddStyle="bodyTextSemiBold">
            {liquid.displayName}
          </StyledText>
        </Flex>
        <Flex flex="1">
          <Flex
            backgroundColor={`${COLORS.black90}${COLORS.opacity20HexCode}`}
            borderRadius={BORDERS.borderRadius8}
            height="2.75rem"
            padding={`${SPACING.spacing8} ${SPACING.spacing12}`}
            alignItems={TYPOGRAPHY.textAlignCenter}
            marginLeft="30.825rem"
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
