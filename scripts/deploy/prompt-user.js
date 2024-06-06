const readline = require('readline')

function promptUser(message) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(`${message} (Y/N): `, answer => {
      rl.close()
      resolve(answer.toUpperCase() === 'Y')
    })
  })
}

module.exports = { promptUser }
