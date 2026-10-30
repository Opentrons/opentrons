import { AltPrimaryButton } from './AltPrimaryButton'
import { DefaultPrimaryButton } from './DefaultPrimaryButton'
import { WarningPrimaryButton } from './WarningPrimaryButton'

import type { ComponentProps, ReactNode } from 'react'
import type { StyleProps } from '../../../primitives/types'

// todo(mm, 2026-07-29): We can probably consolidate the implementations of these
// variants and simplify things.

export type PrimaryButtonProps = ComponentProps<'button'> &
  StyleProps & {
    variant?: 'default' | 'alt' | 'warning'
  }

export function PrimaryButton(props: PrimaryButtonProps): ReactNode {
  if (props.variant === 'alt') {
    const { variant: _, ...rest } = props
    return <AltPrimaryButton {...rest} />
  } else if (props.variant === 'warning') {
    const { variant: _, ...rest } = props
    return <WarningPrimaryButton {...rest} />
  } else {
    const { variant: _, ...rest } = props
    return <DefaultPrimaryButton {...rest} />
  }
}
