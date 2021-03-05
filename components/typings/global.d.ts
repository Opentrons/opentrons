import 'jest-styled-components'
import 'styled-components/cssprop'

declare module '*.css' {
  const classes: { [key: string]: string }
  // eslint-disable-next-line import/no-default-export
  export default classes
}
