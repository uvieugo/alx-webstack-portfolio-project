const getChecks = require('./service')
const server = require('./server')
const {knex, AppMigration} = require('./db')

function pollTsWS (interval){
  try {
    setInterval( () => {
      getChecks();
    }, interval);
  } catch (error) {
    console.log(error)
  }
}

const dbMigrate = async () => {
  return new Promise (resolve => {
    knex.migrate.latest({
      migrationSource: new AppMigration()
    })
    .then(() => {
      console.log('migration run')
        resolve('nil') 
      })
  });

}

async function startWebServer(port){
  let migrate = await dbMigrate()
  server.listen(port, () => {
    console.log(`Order Ready listening on port ${port}`)
  })
}

class App{

  static interval
  static port
  
  constructor(interval,port){
    this.interval = interval;
    this.port = port;
  }
  async start(){
    pollTsWS(this.interval)
    startWebServer(this.port)
  }
}

module.exports = App