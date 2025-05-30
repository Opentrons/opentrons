import type { ComponentProps } from 'react'

export type AnimationVideoProps = ComponentProps<'video'>

/**
 * A `<video>` tag with default props for showing a looping animation.
 *
 * @example
 * ```jsx
 * <AnimationVideo>
 *   <source src="foo.webm" />
 * </AnimationVideo>
 * ```
 */
export function AnimationVideo(props: AnimationVideoProps): JSX.Element {
  return (
    <video
      autoPlay
      loop
      // Our animations don't have audio in the first place, but we apparently need to
      // pass `muted` anyway. It prevents the browser from trying to play audio on
      // connected Bluetooth headphones, which interrupts audio coming from other
      // devices.
      muted
      controls={false}
      {...props}
    >
      {/* Child <source> rendered via {...props} spreading above. */}
    </video>
  )
}
