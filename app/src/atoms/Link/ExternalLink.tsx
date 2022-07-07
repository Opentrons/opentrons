import * as React from 'react'

import {
  Link,
  LinkProps,
  Icon,
  TYPOGRAPHY,
  SPACING,
  Flex,
  ALIGN_CENTER,
} from '@opentrons/components'

export interface ExternalLinkProps extends LinkProps {
  href: string
  id?: string
  children: React.ReactNode
}

export const ExternalLink = (props: ExternalLinkProps): JSX.Element => (
  <Link external {...props}>
    <Flex alignItems={ALIGN_CENTER} css={TYPOGRAPHY.linkPSemiBold}>
      {props.children}
      <Icon size={SPACING.spacing3} marginLeft=".4375rem" name="open-in-new" />
    </Flex>
  </Link>
)
