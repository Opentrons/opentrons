import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  InfoScreen,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getLabwareDefIsStandard } from '@opentrons/shared-data'

import { Divider } from '/app/atoms/structure'
import { getRequiredLabwareDetailsFromLoadCommands } from '/app/transformations/commands'

import { LabwareDetailOverflowMenu } from './LabwareDetailOverflowMenu'

import type { ReactNode } from 'react'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { LabwareDefAndDate } from '/app/local-resources/labware'

export const ProtocolLabwareDetails = (props: {
  commands: RunTimeCommand[]
}): ReactNode => {
  const { commands } = props
  const { t } = useTranslation('protocol_details')

  const labwareAndLidDetails =
    getRequiredLabwareDetailsFromLoadCommands(commands)

  return (
    <>
      {labwareAndLidDetails.length > 0 ? (
        <Flex flexDirection={DIRECTION_COLUMN} width="100%">
          <Flex flexDirection={DIRECTION_ROW}>
            <StyledText
              desktopStyle="bodyDefaultRegular"
              color={COLORS.grey60}
              marginBottom={SPACING.spacing8}
              data-testid="ProtocolLabwareDetails_labware_name"
              width="66%"
            >
              {t('labware_name')}
            </StyledText>
            <StyledText
              desktopStyle="bodyDefaultRegular"
              color={COLORS.grey60}
              data-testid="ProtocolLabwareDetails_quantity"
            >
              {t('quantity')}
            </StyledText>
          </Flex>
          {labwareAndLidDetails?.map((labware, index) => (
            <ProtocolLabwareDetailItem
              key={index}
              isStandard={getLabwareDefIsStandard(labware.labwareDef)}
              displayName={labware.labwareDef.metadata.displayName}
              quantity={labware.quantity}
              labware={{ definition: labware.labwareDef }}
              lidDisplayName={labware.lidDisplayName}
              data-testid={`ProtocolLabwareDetails_item_${index}`}
            />
          ))}
        </Flex>
      ) : (
        <InfoScreen content={t('no_labware_specified')} />
      )}
    </>
  )
}

interface ProtocolLabwareDetailItemProps {
  isStandard: boolean
  displayName: string
  quantity: number
  lidDisplayName?: string
  labware: LabwareDefAndDate
}

export const ProtocolLabwareDetailItem = (
  props: ProtocolLabwareDetailItemProps
): ReactNode => {
  const { t } = useTranslation('protocol_details')
  const { isStandard, displayName, quantity, labware, lidDisplayName } = props
  return (
    <>
      <Divider width="100%" />
      <Flex
        flexDirection={DIRECTION_ROW}
        marginY={SPACING.spacing8}
        alignItems={ALIGN_CENTER}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          width="66%"
          marginRight={SPACING.spacing20}
        >
          {isStandard ? (
            <Icon
              color={COLORS.blue50}
              name="check-decagram"
              height="1rem"
              minHeight="1rem"
              minWidth="1rem"
              marginRight={SPACING.spacing4}
            />
          ) : (
            <Flex marginLeft={SPACING.spacing20} />
          )}
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              desktopStyle="bodyDefaultRegular"
              paddingRight={SPACING.spacing32}
            >
              {displayName}
            </StyledText>
            {lidDisplayName != null ? (
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.grey60}
                paddingRight={SPACING.spacing32}
              >
                {t('with_lid_name', { lid: lidDisplayName })}
              </StyledText>
            ) : null}
          </Flex>
        </Flex>
        <StyledText desktopStyle="bodyDefaultRegular">{quantity}</StyledText>
        <LabwareDetailOverflowMenu labware={labware} />
      </Flex>
    </>
  )
}
