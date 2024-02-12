// TODO(BC, 2023-04-20): this is media not sufficient to determine that we are on the
// touch-only On Device Display of the flex. For development purposes, we are omitting
// the (hover: none) to allow for off device testing. The hover rule should be reintroduced
// before the release of this code to prevent Funny desktop app behavior when the viewport
// is precisely 600x1024
export const touchscreenMediaQuerySpecs = '(height: 600px) and (width: 1024px)'

export const isTouchscreen = window.matchMedia(touchscreenMediaQuerySpecs)
  .matches
