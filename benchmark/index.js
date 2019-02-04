// tslint:disable:no-console

async function run() {
  await require('./decoding-comparison').run()
  await require('./encoding-comparison').run()
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
