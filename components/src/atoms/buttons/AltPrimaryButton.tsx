import { Button } from './Button'

import type { ButtonProps } from './Button'

/**
 * AltPrimaryButton component - alternative grey button variant.
 * This is a convenience wrapper around the Button component.
 *
 * @deprecated Consider using Button component directly with variant="alt"
 */
export type AltPrimaryButtonProps = Omit<ButtonProps, 'variant'>

export function AltPrimaryButton(props: AltPrimaryButtonProps): JSX.Element {
  return <Button variant="alt" {...props} />
}
