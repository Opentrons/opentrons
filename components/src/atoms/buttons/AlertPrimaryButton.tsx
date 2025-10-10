import { Button } from './Button'

import type { ButtonProps } from './Button'

/**
 * AlertPrimaryButton component - alert red button variant.
 * This is a convenience wrapper around the Button component.
 *
 * @deprecated Consider using Button component directly with variant="alert"
 */
export type AlertPrimaryButtonProps = Omit<ButtonProps, 'variant'>

export function AlertPrimaryButton(
  props: AlertPrimaryButtonProps
): JSX.Element {
  return <Button variant="alert" {...props} />
}
