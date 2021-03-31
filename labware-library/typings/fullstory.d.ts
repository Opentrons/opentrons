// TODO(mc, 2021-03-31): migrate to @fullstory/browser npm package
// adapted from https://github.com/fullstorydev/fullstory-browser-sdk/blob/master/src/index.d.ts

declare namespace FullStory {
    interface SnippetOptions {
      orgId: string
      namespace?: string
      debug?: boolean
      host?: string
      script?: string
      recordCrossDomainIFrames?: boolean
      recordOnlyThisIFrame?: boolean // see README for details
      devMode?: boolean
    }
  
    interface UserVars {
      displayName?: string
      email?: string
      [key: string]: any
    }
  
    type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'
  
    interface FullStory {
      anonymize: () => void
      consent: (userConsents?: boolean) => void
      event: (eventName: string, eventProperties: { [key: string]: any }) => void
      identify: (uid: string, customVars?: UserVars) => void
      init: (options: SnippetOptions) => void
      log: ((level: LogLevel, msg: string) => void) & ((msg: string) => void)
      restart: () => void
      setUserVars: (customVars: UserVars) => void
      shutdown: () => void
    }
  }
  
  declare module NodeJS {
    interface Global {
      _fs_namespace: 'FS' | undefined
      FS: FullStory.FullStory | undefined
    }
  }