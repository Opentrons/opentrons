import { Button } from './Button'

import type { ButtonProps } from './Button'

/**
 * PrimaryButton component - default blue button variant.
 * This is a convenience wrapper around the Button component.
 *
 * @deprecated Consider using Button component directly with variant="default"
 */
export type PrimaryButtonProps = Omit<ButtonProps, 'variant'>

export function PrimaryButton(props: PrimaryButtonProps): JSX.Element {
  return <Button variant="default" {...props} />
}
