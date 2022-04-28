import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Overlay,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SIZE_5,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { Portal } from '../../App/portal'
import { LabwareDetails } from '../Labware/LabwareDetails'

import type { LoadLabwareRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { LabwareDefAndDate } from '../Labware/hooks'

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
            .reduce((obj, labware) => {
              if (!obj.has(labware.result.definition.parameters.loadName))
                obj.set(labware.result.definition.parameters.loadName, {
                  ...labware,
                  quantity: 0,
                })
              obj.get(labware.result.definition.parameters.loadName).quantity++
              return obj
            }, new Map())
            .values(),
        ]
      : []

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex flexDirection={DIRECTION_ROW}>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          data-testid={'ProtocolLabwareDetails_labware_name'}
        >
          {t('labware_name')}
        </StyledText>
        <StyledText
          as="label"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkBlack}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          marginLeft={SIZE_5}
          data-testid={'ProtocolLabwareDetails_quantity'}
        >
          {t('quantity')}
        </StyledText>
      </Flex>
      {labwareDetails?.map((labware, index) => {
        return (
          <React.Fragment key={index}>
            <ProtocolLabwareDetailItem
              namespace={labware.params.namespace}
              displayName={labware.result.definition.metadata.displayName}
              quantity={labware.quantity}
              labware={{ definition: labware.result.definition }}
              data-testid={`ProtocolLabwareDetails_item_${index}`}
            />
          </React.Fragment>
        )
      })}
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
        marginY={SPACING.spacing3}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          {namespace === 'opentrons' ? (
            <Icon
              color={COLORS.blue}
              name="check-decagram"
              height=".7rem"
              marginRight={SPACING.spacing3}
            />
          ) : (
            <Flex marginLeft={SPACING.spacingM} />
          )}
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            color={COLORS.darkBlack}
            width={SIZE_5}
          >
            {displayName}
          </StyledText>
        </Flex>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlack}
          marginLeft={'5rem'}
        >
          {quantity}
        </StyledText>
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
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const [
    showLabwareDetailSlideout,
    setShowLabwareDetailSlideout,
  ] = React.useState<boolean>(false)

  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(!showOverflowMenu)
  }

  const handleClickOutside: React.MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(false)
  }

  const handleClickMenuItem: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    setShowOverflowMenu(false)
    setShowLabwareDetailSlideout(true)
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      position={POSITION_RELATIVE}
      marginRight={SPACING.spacing3}
      marginLeft={'auto'}
    >
      <Flex>
        <OverflowBtn onClick={handleOverflowClick} />
      </Flex>
      {showOverflowMenu ? (
        <Flex
          width={'11rem'}
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top="3rem"
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          <MenuItem onClick={handleClickMenuItem}>
            {t('go_to_labware_definition')}
          </MenuItem>
        </Flex>
      ) : null}
      <Portal level="top">
        {showOverflowMenu ? (
          <Overlay
            onClick={handleClickOutside}
            backgroundColor={COLORS.transparent}
          />
        ) : null}
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
