import * as React from 'react'

import {
  Link,
  LinkProps,
  Icon,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

export interface ExternalLinkProps extends LinkProps {
  href: string
  id?: string
  children: JSX.Element
}

export const ExternalLink = (props: ExternalLinkProps): JSX.Element => (
  <Link external {...props} css={TYPOGRAPHY.linkPSemibold}>
    {props.children}
    <Icon
      width={SPACING.spacing3}
      height={SPACING.spacing3}
      marginLeft=".4375rem"
      name="open-in-new"
    ></Icon>
  </Link>
)
