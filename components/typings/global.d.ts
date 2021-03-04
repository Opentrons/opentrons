import 'jest-styled-components'

import { CSSProp } from 'styled-components'
declare module '*.css' {
  const classes: { [key: string]: string }
  // eslint-disable-next-line import/no-default-export
  export default classes
}

declare module 'react' {
  interface Attributes {
    css?: CSSProp
  }
}
