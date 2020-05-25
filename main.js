const puppeteer = require('puppeteer');
const fs = require('fs');
const request = require('request');
const args = require('yargs').argv;

var headers, user, pass, waitAfterLogin;
var wait_default = 15 * 1000;

function validateArgs(args){

  if(!args.user){
    console.error("--user argument is invalid");
    process.exit(1);
  }

  if(!args.pass){
    console.error("--pass argument is invalid");
    process.exit(1);
  }

  console.log('user: ' + args.user);
  console.log('pass: ' + "****");
  console.log('wait: ' + (args.wait || wait_default+" ms (default)") );

}

function setArgs(args){

  user = args.user;
  pass = args.pass;
  waitAfterLogin = args.wait || 15 * 1000; // Default value 15s (15000 milliseconds)

}


// https://dev.to/nulldreams/easy-requests-in-nodejs-1fke
async function get (url, sessionStorage, headers) {
  return new Promise((resolve, reject) => {

    request({
      headers: {
        'User-Agent': headers["user-agent"],
        "Accept" : "*/*",
        "Accept-Language" : "es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3",
        "x-appclientid" : headers["x-appclientid"],
        "x-appclient" : headers["x-appclient"],
        "x-application" : headers["x-application"],
        "x-appversion" : headers["x-appversion"],
        "x-appclientsecret" : headers["x-appclientsecret"],
        "content-type" : headers["content-type"],
        "content-encoding" : headers["content-encoding"],
        "authorization" : "Bearer "+sessionStorage.token,
        "x-messageid" : sessionStorage.rand,
        "Origin" : "https://areaprivada.ufd.es",
        "Connection" : "keep-alive",
        "Referer" : "https://areaprivada.ufd.es/supplies",
      },
      uri: url,
      method: 'GET'
    }, function (error, response, body) {
      
      if (error) return reject(error)

      return resolve(body)

    });

  })
}

async function getSessionStorage (page) {

  const json = await page.evaluate(() => {
    let json = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      json[key] = sessionStorage.getItem(key);
    }
    return json;
  });

  return json;
}

// Save to file
function save (path, data) {
  
  fs.writeFile(path, data, function(err) {
    if(err) {
      console.error("ERROR saving results as ", path);
      console.log(err);
    } else {
      console.log("Saved results as ", path);
    }
  }); 

}

function getData(){

  try {

    var url = "https://areaprivada.ufd.es/login";

    (async () => {

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setRequestInterception(true);

      page.on('request', (request) => {
        
        request.continue();
        
      });

      // Capturing responses
      page.on('response', async (response) => {

        var req_consumptions_start = "https://api.ufd.es/ufd/v1.0/consumptions?filter=";
        
        if (!headers && response.url().startsWith(req_consumptions_start)){

          try{
            var data = await response.json();
            
            // Getting/Copying request headers in order to use them in other request
            headers = {};
            headers["url"] = response.url();
            headers["request_headers"] = response.request().headers();
            headers["response_headers"] = response.headers();
            headers["data"] = data;
            
            // Getting sessionStorage data from browser.
            sessionStorage = await getSessionStorage(page);

            // At this point browser can be closed
            browser.close()
            
            documentNumber = user;
            startDate="01/05/2000"
            endDate="31/12/2100"

            url_supply_points = "https://api.ufd.es/ufd/v1.0/supplypoints?filter=documentNumber::"+documentNumber+"&offset=1&limit=15"
            
            var supplypoints = JSON.parse(await get(url_supply_points, sessionStorage, headers.request_headers));
            
            var cups = supplypoints.supplyPoints.items[0].cups;
            var meterid =  supplypoints.supplyPoints.items[0].measurementEquipments.meters.item.meter ;

            url_actual_current_meter = "https://api.ufd.es/ufd/v1.0/meterReadings?filter=documentNumber::"+documentNumber+"%7Ccups::"+cups+"%7CmeasurementSystem::O%7CmeterId::"+meterid+"%7CreadingTypeIds::441,421,411" ;    
            url_historic_data = "https://api.ufd.es/ufd/v1.0/consumptions?filter=nif::"+documentNumber+"%7Ccups::"+cups+"%7CstartDate::"+startDate+"%7CendDate::"+endDate+"%7Cgranularity::F%7Cunit::K%7Cgenerator::0%7CisDelegate::N%7CmeasurementSystem::O";

            actual_current_meter = await get(url_actual_current_meter, sessionStorage, headers.request_headers);
            historic_data = await get(url_historic_data, sessionStorage, headers.request_headers);

            console.log("===============");
            console.log("Results: ");

            save("output/meter_readings.json", historic_data );
            save("output/consumptions.json", actual_current_meter );

          }catch(e){
            console.log("ERROR");
            console.error(e);
          }


        }

      });

      await page.goto(url);
      
      // Fill user input
      await page.type('.MuiInputBase-input, .MuiOutlinedInput-input', user);
      // Fill pass input
      await page.type('input[type="password"]', ""+pass);
      // Click on login button
      await page.click('button[text="Entrar"]');

      // Wait n milliseconds after login to continue
      await page.waitFor(waitAfterLogin); 
      
    })();

  } catch (err) {
      console.error(err);
  }

}

function main(){

  validateArgs(args);

  setArgs(args);

  getData();

}


main()