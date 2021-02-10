const assert = require('assert')
const { resolve, join } = require('path')
const { createInterface } = require('readline')
const { createReadStream } = require('fs')
const { readdir } = require('fs').promises
const { digraph } = require('graphviz')

async function* getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true })
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name)
    if (dirent.isDirectory()) {
      yield* getFiles(res)
    } else {
      yield [dir, dirent]
    }
  }
}

const USAGE = "\nUsage:\n  node ./scripts/parseReduxDeps 'src/components/'"
assert(process.argv.length === 3, USAGE)
;(async () => {
  let map = {}
  const searchDirPath = join(process.cwd(), process.argv[2])
  for await (const [dir, dirent] of getFiles(searchDirPath)) {
    if (dirent.name.endsWith('.js')) {
      const path = resolve(dir, dirent.name)
      const fileStream = createReadStream(path)
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      })
      for await (const line of rl) {
        const m = line.match(new RegExp("^.*../redux/((?!types)[^/']*).*$"))
        if (m) {
          const reduxDep = m[1]
          const key = dir.match(new RegExp(`${searchDirPath}([^/]*)/?`))[1]
          const value = map[key]
            ? map[key].includes(reduxDep)
              ? map[key]
              : [...map[key], reduxDep]
            : [reduxDep]
          map = { ...map, [key]: value }
        }
      }
    }
  }

  // Create graph
  const g = digraph('ReduxDepsComponents')

  g.set('ranksep', 4)
  g.set('ratio', 'auto')

  // Make Component Nodes
  let uniqReduxDeps = []
  const listOfDeps = Object.keys(map).map(comp => ({
    name: comp,
    deps: map[comp],
  }))

  listOfDeps
    .sort((i, j) => i.deps.length - j.deps.length)
    .forEach(({ name }) => {
      g.addNode(name, { color: 'blue' })
      map[name].forEach(dep => {
        if (!uniqReduxDeps.includes(dep)) {
          uniqReduxDeps = [...uniqReduxDeps, dep]
        }
      })
    })

  // Make Redux Slice Nodes
  uniqReduxDeps.forEach(dep => g.addNode(dep, { color: 'red' }))

  Object.keys(map).forEach((comp, i) => {
    map[comp].forEach(dep => {
      g.addEdge(comp, dep, { color: 'green' })
    })
  })

  // Print the dot script
  console.log(g.to_dot())

  // Generate a PNG output
  g.output('png', 'reduxDepsGraph.png', e => console.error(e))
})()
