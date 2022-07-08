import * as React from 'react'

type DOMRectProperty = keyof Omit<DOMRect, 'toJSON'>
interface props {
  getElementProperty: (property: DOMRectProperty) => number
}

/**
 *
 * @param   {React.RefObject} ref(useRef)
 * @returns {{ getElementProperty: (property: DOMRectProperty) => number }}
 *          Function returns DOMRectProperty such as x, y, width, height, top, left, right, bottom.
 * @example
 * import { useGetElementDOMRectProperty } from './useGetElementDOMRectProperty';
 * const targetRef = React.useRef(null)
 * const { getElementProperty } = useGetElementDOMRectProperty<HTMLDivElement>(targetRef)
 *
 * const height = getElementProperty('height') // need to specify property
 *
 * <Flex ref={targetRef}>
 *  <StyledText as="p">example</StyledText>
 * </Flex>
 *
 */
export const useGetElementDOMRectProperty = <T extends HTMLElement>(
  elementRef: React.RefObject<T>
): props => {
  const getElementProperty = React.useCallback(
    (targetProperty: DOMRectProperty): number => {
      const clientRect = elementRef.current?.getBoundingClientRect()
      if (clientRect != null) {
        return clientRect[targetProperty]
      }
      // if clientRect is undefined, return 0
      return 0
    },
    [elementRef]
  )

  return {
    getElementProperty,
  }
}
