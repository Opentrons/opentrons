import 'usb-detection'

declare module 'usb-detection' {
  export function off(event: string, handler: unknown): void
}
