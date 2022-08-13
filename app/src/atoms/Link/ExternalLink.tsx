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
  children: React.ReactNode
}

export const ExternalLink = (props: ExternalLinkProps): JSX.Element => (
  <Link external {...props} css={TYPOGRAPHY.linkPSemiBold}>
    {props.children}
    <Icon
      size={SPACING.spacing3}
      marginLeft="0.4375rem"
      name="open-in-new"
      aria-label="open_in_new_icon"
    />
  </Link>
)
