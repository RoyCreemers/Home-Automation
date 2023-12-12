
# Home-Automation

## Shelly Scripts

### HA Watchdog
The HA (Home Assistant) Watchdog monitors HA from the Shelly Plus Plug S. 
- After power on, the light ring of the Plug will turn WHITE.
- After HA is discovered, the ring of the Plug will turn GREEN. Bright green indicates the Plug  is active, light green indicates the Plug is inactive.
- When the connection with HA is lost, the Plug will turn RED, and it will turn active.  By default HA will be checked every 60 seconds, and 3 subsequent errors will be considered a lost connection.

#### Prerequisites
- Home Assistant.
- Shelly Plus Plug S.

#### Installation
- Make sure Home Assistant has a fixed IP.
- Modify [script](shelly/ha-watchdog.js) and change the Home Assistant IP address.
- Install, enable and start the [script](shelly/ha-watchdog.js) as illustrated for example in the [Shelly script tutorial](https://shelly-api-docs.shelly.cloud/gen2/Scripts/Tutorial).