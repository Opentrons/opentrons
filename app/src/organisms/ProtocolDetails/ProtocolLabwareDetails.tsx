import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getLabwareDefURI } from '@opentrons/shared-data'
import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Portal } from '../../App/portal'
import { LabwareDetails } from '../LabwareDetails'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'

import type { LoadLabwareRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'
import type { LabwareDefAndDate } from '../../pages/Labware/hooks'

interface ProtocolLabwareDetailsProps {
  requiredLabwareDetails: LoadLabwareRunTimeCommand[] | null
}

export const ProtocolLabwareDetails = (
  props: ProtocolLabwareDetailsProps
): JSX.Element => {
  const { requiredLabwareDetails } = props
  const { t } = useTranslation('protocol_details')

  const labwareDetails =
    requiredLabwareDetails != null
      ? [
          ...requiredLabwareDetails
            .reduce((acc, labware) => {
              if (labware.result?.definition == null) return acc
              else if (!acc.has(getLabwareDefURI(labware.result.definition))) {
                acc.set(getLabwareDefURI(labware.result.definition), {
                  ...labware,
                  quantity: 0,
                })
              }
              acc.get(getLabwareDefURI(labware.result?.definition)).quantity++
              return acc
            }, new Map())
            .values(),
        ]
      : []

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      width="100%"
      marginBottom={SPACING.spacing8}
    >
      <Flex flexDirection={DIRECTION_ROW}>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing8}
          data-testid="ProtocolLabwareDetails_labware_name"
          width="66%"
        >
          {t('labware_name')}
        </StyledText>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          data-testid="ProtocolLabwareDetails_quantity"
        >
          {t('quantity')}
        </StyledText>
      </Flex>
      {labwareDetails?.map((labware, index) => (
        <ProtocolLabwareDetailItem
          key={index}
          namespace={labware.params.namespace}
          displayName={labware.result?.definition?.metadata?.displayName}
          quantity={labware.quantity}
          labware={{ definition: labware.result?.definition }}
          data-testid={`ProtocolLabwareDetails_item_${index}`}
        />
      ))}
    </Flex>
  )
}

interface ProtocolLabwareDetailItemProps {
  namespace: string
  displayName: string
  quantity: string
  labware: LabwareDefAndDate
}

export const ProtocolLabwareDetailItem = (
  props: ProtocolLabwareDetailItemProps
): JSX.Element => {
  const { namespace, displayName, quantity, labware } = props
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
          {namespace === 'opentrons' ? (
            <Icon
              color={COLORS.blueEnabled}
              name="check-decagram"
              height="0.75rem"
              minHeight="0.75rem"
              minWidth="0.75rem"
              marginRight={SPACING.spacing8}
            />
          ) : (
            <Flex marginLeft={SPACING.spacing20} />
          )}
          <StyledText as="p" paddingRight={SPACING.spacing32}>
            {displayName}
          </StyledText>
        </Flex>
        <StyledText as="p">{quantity}</StyledText>
        <LabwareDetailOverflowMenu labware={labware} />
      </Flex>
    </>
  )
}

interface LabwareDetailOverflowMenuProps {
  labware: LabwareDefAndDate
}

export const LabwareDetailOverflowMenu = (
  props: LabwareDetailOverflowMenuProps
): JSX.Element => {
  const { labware } = props
  const { t } = useTranslation('protocol_details')
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const [
    showLabwareDetailSlideout,
    setShowLabwareDetailSlideout,
  ] = React.useState<boolean>(false)

  const handleClickMenuItem: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(false)
    setShowLabwareDetailSlideout(true)
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      marginRight={SPACING.spacing8}
      marginLeft={SPACING.spacingAuto}
    >
      <Flex>
        <OverflowBtn onClick={handleOverflowClick} />
      </Flex>
      {showOverflowMenu ? (
        <Flex
          whiteSpace="nowrap"
          zIndex={10}
          borderRadius="4px 4px 0px 0px"
          boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="2.3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem onClick={handleClickMenuItem}>
            {t('go_to_labware_definition')}
          </MenuItem>
        </Flex>
      ) : null}
      <Portal level="top">
        {menuOverlay}
        {showLabwareDetailSlideout ? (
          <LabwareDetails
            labware={labware}
            onClose={() => setShowLabwareDetailSlideout(false)}
          />
        ) : null}
      </Portal>
    </Flex>
  )
}
