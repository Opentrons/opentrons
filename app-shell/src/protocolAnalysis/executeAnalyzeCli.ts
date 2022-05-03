export function executeAnalyzeCli(
  pythonPath: string,
  sourcePath: string,
  outputPath: string
): Promise<void> {
  throw new Error('ahh')
}

// export function analyzeProtocolSource(
//   pythonPath: string,
//   sourcePath: string,
//   outputPath: string
// ): Promise<void> {
//   if (pythonPath === null) {
//     return Promise.reject(
//       new Error('No Python interpreter set, was `initializePython` called?')
//     )
//   }

//   return execa(pythonPath, [
//     '-m',
//     'opentrons.cli',
//     'analyze',
//     '--json',
//     srcFilePath,
//   ])
//     .then(output => {
//       log.debug('python output: ', output)
//       fs.writeFile(destFilePath, output.stdout)
//     })
//     .catch(e => {
//       log.error(e)
//       fs.writeJSON(destFilePath, {
//         errors: [
//           {
//             id: uuid(),
//             errorType: 'AnalysisError',
//             createdAt: new Date().getTime(),
//             detail: e.message,
//           },
//         ],
//         files: [],
//         config: {},
//         metadata: [],
//         commands: [],
//       })
//     })
// }
