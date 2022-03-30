import * as React from 'react'

import {
  Text,
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

interface ModalProps extends BaseModalProps {
  onClose?: () => void
  title?: string
  children?: React.ReactNode
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
          <Text css={TYPOGRAPHY.h3SemiBold}>{props.title}</Text>
          {props.onClose != null && (
            <Box onClick={props.onClose}>
              <Icon
                name={'close'}
                width={SPACING.spacing4}
                height={SPACING.spacing4}
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
