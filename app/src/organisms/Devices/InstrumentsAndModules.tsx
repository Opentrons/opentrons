import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getPipetteModelSpecs, LEFT, RIGHT } from '@opentrons/shared-data'
import { useModulesQuery, usePipettesQuery } from '@opentrons/react-api-client'

import {
  Flex,
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  SIZE_3,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Banner } from '../../atoms/Banner'
import { useCurrentRunId } from '../ProtocolUpload/hooks'
import { ModuleCard } from '../ModuleCard'
import { useIsOT3, useIsRobotViewable, useRunStatuses } from './hooks'
import { getIs96ChannelPipetteAttached } from './utils'
import { PipetteCard } from './PipetteCard'
import { GripperCard } from '../GripperCard'

const EQUIPMENT_POLL_MS = 5000
interface InstrumentsAndModulesProps {
  robotName: string
}

export function InstrumentsAndModules({
  robotName,
}: InstrumentsAndModulesProps): JSX.Element | null {
  const { t } = useTranslation(['device_details', 'shared'])

  const attachedPipettes = usePipettesQuery({
    refetchInterval: EQUIPMENT_POLL_MS,
  })?.data ?? { left: undefined, right: undefined }
  const isRobotViewable = useIsRobotViewable(robotName)
  const currentRunId = useCurrentRunId()
  const { isRunTerminal } = useRunStatuses()
  const isOT3 = useIsOT3(robotName)

  // TODO(BC, 2022-12-05): replace with attachedGripper after RLAB-88 is done
  const [tempAttachedGripper, tempSetAttachedGripper] = React.useState<{
    model: string
    serialNumber: string
  } | null>(null)

  const is96ChannelAttached = getIs96ChannelPipetteAttached(
    attachedPipettes?.left ?? null
  )
  const attachedModules =
    useModulesQuery({ refetchInterval: EQUIPMENT_POLL_MS })?.data?.data ?? []
  // split modules in half and map into each column separately to avoid
  // the need for hardcoded heights without limitation, array will be split equally
  // or left column will contain 1 more item than right column
  // TODO(bh, 2022-10-27): once we're using real gripper data, combine the extension mount/module data into columns pre-render
  const halfAttachedModulesSize = isOT3
    ? Math.floor(attachedModules?.length / 2)
    : Math.ceil(attachedModules?.length / 2)
  const leftColumnModules = attachedModules?.slice(0, halfAttachedModulesSize)
  const rightColumnModules = attachedModules?.slice(halfAttachedModulesSize)

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flexDirection={DIRECTION_COLUMN}
      width="100%"
    >
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginBottom={SPACING.spacing4}
        id="InstrumentsAndModules_title"
      >
        {t('instruments_and_modules')}
      </StyledText>
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_CENTER}
        minHeight={SIZE_3}
        paddingBottom={SPACING.spacing3}
        width="100%"
        flexDirection={DIRECTION_COLUMN}
      >
        {currentRunId != null && !isRunTerminal && (
          <Flex
            paddingBottom={SPACING.spacing4}
            flexDirection={DIRECTION_COLUMN}
            paddingX={SPACING.spacing2}
            width="100%"
          >
            <Banner type="warning">{t('robot_control_not_available')}</Banner>
          </Flex>
        )}
        {isRobotViewable ? (
          <Flex gridGap={SPACING.spacing3} width="100%">
            <Flex
              flex="50%"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing3}
            >
              <PipetteCard
                pipetteId={attachedPipettes.left?.id}
                pipetteInfo={
                  attachedPipettes.left?.model != null
                    ? getPipetteModelSpecs(attachedPipettes.left?.model) ?? null
                    : null
                }
                mount={LEFT}
                robotName={robotName}
                is96ChannelAttached={is96ChannelAttached}
              />
              {/* extension mount here */}
              {isOT3 ? (
                <GripperCard
                  robotName={robotName}
                  attachedGripper={tempAttachedGripper}
                  tempSetAttachedGripper={tempSetAttachedGripper}
                />
              ) : null}
              {leftColumnModules.map((module, index) => (
                <ModuleCard
                  key={`moduleCard_${String(module.moduleType)}_${String(
                    index
                  )}`}
                  robotName={robotName}
                  module={module}
                  isLoadedInRun={false}
                />
              ))}
            </Flex>
            <Flex
              flex="50%"
              flexDirection={DIRECTION_COLUMN}
              gridGap={SPACING.spacing3}
            >
              {!Boolean(is96ChannelAttached) ? (
                <PipetteCard
                  pipetteId={attachedPipettes.right?.id}
                  pipetteInfo={
                    attachedPipettes.right?.model != null
                      ? getPipetteModelSpecs(attachedPipettes.right?.model) ??
                        null
                      : null
                  }
                  mount={RIGHT}
                  robotName={robotName}
                  is96ChannelAttached={false}
                />
              ) : null}
              {rightColumnModules.map((module, index) => (
                <ModuleCard
                  key={`moduleCard_${String(module.moduleType)}_${String(
                    index
                  )}`}
                  robotName={robotName}
                  module={module}
                  isLoadedInRun={false}
                />
              ))}
            </Flex>
          </Flex>
        ) : (
          <Flex
            alignItems={ALIGN_CENTER}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacingSM}
            justifyContent={JUSTIFY_CENTER}
            minHeight={SIZE_3}
            padding={SPACING.spacingSM}
          >
            {/* TODO(bh, 2022-10-20): insert "offline" image when provided by illustrator */}
            <StyledText
              as="p"
              color={COLORS.errorDisabled}
              id="InstrumentsAndModules_offline"
            >
              {t('offline_instruments_and_modules')}
            </StyledText>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
