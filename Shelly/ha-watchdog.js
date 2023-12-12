let CONFIG = {
  endpoint: "http://192.168.68.129:8123",   // Home assistant IP
  numberOfFails: 3,                         // Number of failures that trigger the power on
  httpTimeout: 10,                          // Time in seconds after which the http request is considered failed
  pingTime: 60,                             // Time in seconds to retry a "ping"
};

let GREEN = 0;
let RED = 0;
let WHITE = 0;

let failCounter = 0;
let pingTimer = null;
let error = true;

function PingHomeAssistant()
{
  Shelly.call(
    "HTTP.Request",
    { method: "GET", url: CONFIG.endpoint, timeout: CONFIG.httpTimeout},
    function (response, error_code, error_message)
    {
      if (error_code === -114 || error_code === -104)
      {
        console.log("Failed to reach HA: ", error_code, " ", error_message);
        failCounter++;
      } 
      else
      {
        console.log("Succeeded to probe HA: ", error_code);
        failCounter = 0;
        
        if (error === true)
        {
          SetLightRing(GREEN, 20,1);
          error = false;
        }
      }

      if (failCounter === CONFIG.numberOfFails)
      {
        console.log("Too many fails, turning on plug...");
        error = true;
              
        Shelly.call(
          "Switch.Set",
          { id: 0, on: true },
          function () {});
        
        SetLightRing(RED, 20,20);
      }
    });
}

// String '0',...,'F' -> 0,...,15 (case agnostic)
function HexCharToInt(hexChar)
{
  if( hexChar > 96 && hexChar < 103 )
    return 10 + (hexChar - 97);
  if( hexChar > 64 && hexChar < 71 )
    return 10 + (hexChar - 65);
  if( hexChar > 47 && hexChar < 58 )
    return (hexChar - 48);

  die("Invalid hex value.");
}

// HH string ('A3') -> integer (163)
function HexToInt(hex)
{
  return 16 * HexCharToInt(hex.at(0)) + HexCharToInt(hex.at(1));
}

// HH string ('A3') -> shelly rgb integer (64 = 163 / 255 * 100)
function HexToShellyColorValue(hex)
{
  return Math.round( HexToInt( hex ) * 0.392156 );
}

function RGBStringToShellyValues(rgbString)
{
  return ([
    HexToShellyColorValue(rgbString.slice(1, 3)),
    HexToShellyColorValue(rgbString.slice(3, 5)),
    HexToShellyColorValue(rgbString.slice(5, 7)),
  ]);
}

function ReportConfigError(res, ec, em)
{
  if ( ec )
    console.log("Config update error", ec, em);
}

function ConfigurePlug()
{
  let uiConfig = Shelly.getComponentConfig("plugs_ui");
  if( uiConfig.leds.mode !== "switch" )
  {
    uiConfig.leds.mode = "switch";
    Shelly.call( "PLUGS_UI.SetConfig", { config: uiConfig }, ReportConfigError )
  }
}
  
function SetLightRing(shellyRGB, onBrightness, offBrightness)
{
  let onColorConfig = { rgb: shellyRGB, brightness: onBrightness };
  let offColorConfig = { rgb: shellyRGB, brightness: offBrightness };
  let uiConfig = Shelly.getComponentConfig("plugs_ui");

  if( uiConfig.leds.mode === "switch" )
  {
    uiConfig.leds.colors["switch:0"].on = onColorConfig;
    uiConfig.leds.colors["switch:0"].off = offColorConfig;

    // This call would fail in firmware 1.0.0-beta up to at least 1.0.8:
    // Shelly.call( "PLUGS_UI.SetConfig", { config: uiConfig }, ReportConfigError )
    // Hence, using the rpc api to achieve the same.
    let configUrl = "http://localhost/rpc/PLUGS_UI.SetConfig?config=" + JSON.stringify(uiConfig);
    Shelly.call("HTTP.Request", { method: "GET", url: configUrl, timeout: 15, ssl_ca: "*" }, ReportConfigError);
  }
  else
  {
    console.log("Incorrect color mode (", uiConfig.leds.mode, "), should be \"switch\"");
  }
}

console.log("Starting HA Watchdog");
ConfigurePlug();
GREEN = RGBStringToShellyValues("#008000");
RED   = RGBStringToShellyValues("#FF0000");
WHITE = RGBStringToShellyValues("#FFFFFF");

pingTimer = Timer.set(CONFIG.pingTime * 1000, true, PingHomeAssistant);
SetLightRing(WHITE, 20,20);
