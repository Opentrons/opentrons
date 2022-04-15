import * as React from 'react'

import {
  Box,
  Icon,
  BaseModal,
  BaseModalProps,
  TYPOGRAPHY,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
} from '@opentrons/components'

import { Divider } from '../structure'
import { StyledText } from '../text'
import type { IconName } from '@opentrons/components'

interface ModalProps extends BaseModalProps {
  onClose?: () => void
  title?: React.ReactNode
  children?: React.ReactNode
  icon?: IconName
  iconColor?: string
}

export const Modal = (props: ModalProps): JSX.Element => {
  const header =
    props.title != null ? (
      <>
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          paddingX={SPACING.spacing5}
          paddingTop={SPACING.spacing4}
        >
          <Flex alignItems={ALIGN_CENTER}>
            {props.icon != null && (
              <Icon
                name={props.icon}
                color={props.iconColor}
                width={SPACING.spacing5}
                height={SPACING.spacing5}
                marginRight={SPACING.spacing3}
              />
            )}
            <StyledText as="h3" css={TYPOGRAPHY.h3SemiBold}>
              {props.title}
            </StyledText>
          </Flex>
          {props.onClose != null && (
            <Box
              onClick={props.onClose}
              role="button"
              alignItems={ALIGN_CENTER}
            >
              <Icon
                name={'close'}
                width={SPACING.spacing5}
                height={SPACING.spacing5}
              />
            </Box>
          )}
        </Flex>
        <Divider width="100%" paddingTop="0" paddingBottom={SPACING.spacing4} />
      </>
    ) : null

  return (
    <BaseModal width={'31.25rem'} noHeaderStyles header={header}>
      {props.children}
    </BaseModal>
  )
}
