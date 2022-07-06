import * as React from 'react';

type DOMRectProperty = keyof Omit<DOMRect, 'toJSON'>;
interface props {
    getElementProperty: (property: DOMRectProperty) => number;
}

export const useGetElementProperty = <T extends HTMLElement>(
elementRef: React.RefObject<T>): props  => {
    const getElementProperty = React.useCallback(
      (targetProperty: DOMRectProperty): number => {
        const clientRect = elementRef.current?.getBoundingClientRect();
        if (clientRect !=null) {
          return clientRect[targetProperty];
        }
        // if clientRect is undefined, return 0
          return 0;
      },
      [elementRef]
    );
  
    return {
      getElementProperty,
    };
  };