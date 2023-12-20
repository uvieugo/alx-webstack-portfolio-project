const dotenv = require('dotenv').config();
const needle = require('needle');
const {XMLParser} = require('fast-xml-parser');
const dayjs = require('dayjs');
const duration = require('dayjs/plugin/duration');
const tsHost = process.env.TS_HOST;
dayjs.extend(duration);
const Check = require('./check');

function setKDSStatus(numberCode){
  let ksdOrderStatus
  switch (numberCode) {
    case 30:
      ksdOrderStatus = "SENT"
      break;
    case 50:
      ksdOrderStatus = "PREP_DONE"
      break;
    case 60:
      ksdOrderStatus = "READY"
      break;
    case 100:
      ksdOrderStatus = "CANCELLED"
      break;
    default:
      ksdOrderStatus = ""
      break;
  }
  return ksdOrderStatus
}

const getTodayChecks = async () => {
  let currentDay = dayjs().format("YYYY-MM-DD")
  const requestData = `<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
      <soap:Body>
          <GetChecks xmlns="http://micros-hosting.com/EGateway/">
              <ppCheckFilter>
              <LookUpStartDate>${currentDay}</LookUpStartDate>
                  <IncludeClosedCheck>true</IncludeClosedCheck>
              </ppCheckFilter>
              <ppChecksResponse />
          </GetChecks>
      </soap:Body>
  </soap:Envelope>`
  
  const baseURL = `http://${tsHost}:8080/egateway/simphonyposapiweb.asmx`;
  
  const options = {
    parse: false,
    headers: { 
      'Content-Type': 'text/xml',
      'SOAPAction' : 'http://micros-hosting.com/EGateway/GetOpenChecksEx'
    }
  }

  try {
    return new Promise(resolve => {
      needle.post(baseURL, requestData, options, function(err, resp) {
        if(err){
          resolve('error')
          console.log(err)
        }else{
          if(resp.statusCode===200){
            resolve(parseTSMessage(resp.body))
          }
          else{
            console.log(resp.body)
          }
          // resolve(resp.body)
        }
      })
  
    })
  } catch (error) {
    // console.log(error)
    return('error');
  }
}

async function parseTSMessage(message){

  const alwaysArray = [
    "soap:Envelope.soap:Body.GetChecksResponse.ppChecksResponse.Checks.SimphonyPosApi_CheckSummaryEx"
  ];

  const parserOptions = {
    ignoreAttributes : false,
    allowBooleanAttributes: true,
    isArray: (name, jpath, isLeafNode, isAttribute) => { 
      if( alwaysArray.indexOf(jpath) !== -1) return true;
    }
  };
  const parser = new XMLParser(parserOptions);

  let checkJson = parser.parse(message)['soap:Envelope']['soap:Body']['GetChecksResponse']['ppChecksResponse'];

  let OperationalResult = checkJson.hasOwnProperty('OperationalResult') ? checkJson.OperationalResult : ""
  let Checks = checkJson.hasOwnProperty("Checks") ? checkJson.Checks.SimphonyPosApi_CheckSummaryEx : []
  let currentCheck
  Checks.forEach(async element => {
    let {CheckID,CheckNum,CheckOpenTime,CheckSeq} = element
    let KdsStatus = element.hasOwnProperty("LastKnownKdsOrderStatus") ? element.LastKnownKdsOrderStatus.Status : ""
    let KdsStatusTime = element.hasOwnProperty("LastKnownKdsOrderStatus") ? element.LastKnownKdsOrderStatus.ChangedTime : ""
    currentCheck = await Check.find(CheckSeq)
    if (currentCheck){
      // console.log(setKDSStatus(KdsStatus))
      if(CheckID != currentCheck.CheckID){
        currentCheck.CheckID = CheckID
      }
      if(setKDSStatus(KdsStatus) != currentCheck.KdsStatus){
        currentCheck.KdsStatus = setKDSStatus(KdsStatus)
      }
      if(KdsStatus == 'READY' ){
        currentCheck.KdsStatusTime = dayjs(KdsStatusTime).add(1, 'hour').format()
        let duration = dayjs.duration(dayjs().diff(currentCheck.KdsStatusTime)).as('minutes')
      }
      currentCheck.save()
    }else{
      currentCheck = new Check({
        CheckID: CheckID, CheckNum: CheckNum, CheckOpenTime: dayjs(CheckOpenTime).add(1, 'hour').format(), CheckSeq: CheckSeq, 
        KdsStatus: setKDSStatus(KdsStatus),
        KdsStatusTime: dayjs(KdsStatusTime).add(1, 'hour').format()
      })
      currentCheck.save()
    }
  });

}

module.exports = getTodayChecks


// TODO Manual change show item status