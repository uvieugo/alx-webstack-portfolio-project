const {knex:db }= require('./db')
const dayjs = require('dayjs')

const insertCheck = (check) => {
  return db('orders')
  .insert(check)
  .then( result => result)
  .catch(error => console.log(error))
}

const updateCheck = (check) => {
  // console.log(check)
  return db('orders')
  .where('ID', check.ID)
  .update(check)
  .then( result => result)
  .catch( error => console.log(error))
}

const getCheck = (CheckSeq) => {
  return db('orders')
  .where('CheckSeq', CheckSeq).first()
  .then(result => (result) )
  .catch(error => console.log(error))
}

const getChecks = (date) => {
  return db('orders')
  .whereLike('CheckOpenTime', `%${date}%`)
  .then( result => result.filter(row => row.KdsStatus !== ""))
  .catch(error => console.log(error))
}


class Check{
  ID
  CheckID
  CheckNum
  CheckOpenTime
  CheckSeq
  KdsStatus
  KdsStatusTime
  ShowItem

  constructor(check){
    this.ID = check.hasOwnProperty('ID') ? check.ID : null
    this.CheckID = check.CheckID
    this.CheckNum = check.CheckNum
    this.CheckOpenTime = dayjs(check.CheckOpenTime).format()
    this.CheckSeq = check.CheckSeq
    this.KdsStatus = check.KdsStatus
    this.KdsStatusTime = dayjs(check.KdsStatusTime).format()
    this.ShowItem = this.ID ? check.ShowItem : true
    // if (this.KdsStatus == 'READY'){
    //   let duration = dayjs.duration(dayjs().diff(this.KdsStatusTime)).as('minutes')
    //   if(duration > 5){
    //     this.ShowItem = false
    //   }
    // }
    return this;
  }

  save(){
    if(this.ID){
      updateCheck(this)
    }
    else{
      insertCheck(this)
    }
  }

  update(check){
    if(check.CheckID != this.CheckID){
      this.CheckID = check.CheckID
    }
    if(check.KdsStatus != this.KdsStatus){
      this.KdsStatus = check.KdsStatus
    }
    if(this.KdsStatusTime == undefined){
      this.KdsStatusTime = dayjs(check.KdsStatusTime).add(1, 'hour').format()
    }

    if(this.KdsStatus == 'READY' ){
      this.KdsStatusTime = dayjs(check.KdsStatusTime).add(1, 'hour').format()
      let duration = dayjs.duration(dayjs().diff(this.KdsStatusTime)).as('minutes')
      if(duration > 1){
        this.ShowItem = false
      }
    }

    this.save()
  }

  static async find(CheckSeq){
    let foundCheck = await getCheck(CheckSeq)
    if (foundCheck){
      return new Check(foundCheck)
    }else{
      return null
    }
  }

  static async checksForToday(){
    let currentDate = dayjs().format("YYYY-MM-DD")
    // console.log(currentDate)
    return await getChecks(currentDate)
  }
}



module.exports = Check