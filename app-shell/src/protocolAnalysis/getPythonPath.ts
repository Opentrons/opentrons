import { createLogger } from '../log'

const log = createLogger('python/getPythonPath')

let pythonPath: Promise<string> | null = null

export function selectPythonPath(pythonOverride: string | null): void {
  throw new Error('oh no')
}

export function getPythonPath(): Promise<string> {
  throw new Error('oh no')
}

// function initializePython(): void {
//   const pathToPythonOverride = getConfig().python.pathToPythonOverride

//   selectPythonPath(pathToPythonOverride)
//   let pythonCandidates = [
//     // Linux + macOS
//     path.join(process.resourcesPath ?? './', 'python', 'bin', 'python3'),
//     // Windows
//     path.join(process.resourcesPath ?? './', 'python'),
//   ]

//   if (pathToPythonOverride != null) {
//     pythonCandidates = [
//       pathToPythonOverride,
//       // Linux + macOS
//       path.join(pathToPythonOverride, 'bin/python3'),
//       // Windows
//       path.join(pathToPythonOverride, 'python'),
//       ...pythonCandidates,
//     ]
//   }

//   pythonPath = pythonCandidates.filter(testPythonPath)[0] ?? null

//   if (pythonPath != null)
//     log.info('Python environment selected', { pythonPath })
//   else {
//     log.error('No valid Python environment found')
//   }

//   function testPythonPath(candidatePath: string): boolean {
//     try {
//       fs.accessSync(candidatePath, fs.constants.X_OK)
//       const stats = fs.statSync(candidatePath)

//       if (stats.isFile()) {
//         return true
//       }
//     } catch (error) {
//       log.debug('Python candidate not executable, skipping', {
//         candidatePath,
//         error,
//       })
//     }

//     return false
//   }
