/* eslint-disable */
declare global {
  interface Global {
    document: {
      getElementsByClassName: (val: string) => any[]
    }
  }
  enablePrereleaseMode: () => void
}

interface Window {
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: (val: string) => any
}