declare global {
  interface Global {
    document: {
      getElementsByClassName: (val: string) => any[]
    }
  }
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: (val: string) => any
  }
  const enablePrereleaseMode: () => void
}

