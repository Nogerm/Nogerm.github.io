let bluetoothDevice = null;
let bluetoothDevice2 = null;
let RXcharacteristic = null;
let TXcharacteristic = null;
let RXcharacteristic2 = null;
let TXcharacteristic2 = null;
let queryTimer = null;
let query_interval = null;
let updateTimer = null;
let data_points = null;
let remote_speed_up = null;
let selectedTab = null;
let selectedDevice = null;
let logData = [];
let newData = {
  pitch: 0,
  pitch_datum: 0,
  force_level: 0,
  intent: 0,
  current_l: 0,
  current_r: 0,
  rpm_l: 0,
  rpm_r: 0,
  vx: 0,
  vy: 0,
  sw_lf: 1,
  sw_lb: 1,
  sw_rf: 1,
  sw_rb: 1,
  spd_dec: 0,
  spd_pls: 0,
  fac_pls: 0,
  fac_mns: 0,
  BLE_FLAG: 0,
  IR_FY: 0,
};

//charts
var chartGaugePitch = null;
var chartGaugeRPML  = null;
var chartGaugeRPMR  = null;
var chartVxvy       = null;
var chartPitch      = null;
var chartIntent     = null;
var chartCurrentL   = null;
var chartCurrentR   = null;
var chartRPML       = null;
var chartRPMR       = null;
var chartVx         = null;

//config
const device_name_filter = "HST_UART";
const default_query_interval = 50;
const default_data_points = 40;
const default_remote_speed_up = 0;
const default_IR_dist = 2;
const default_selected_tab = 1;
const default_selected_device = 0;
const default_log_number_return = 40;
const x_label_interval = 150;
const serviceUUID  = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const serviceUUID2 = "6e400001-b5a3-f393-e0a9-e50e24dcca9a";
const QUERY_DATA_HEADER   = 0xFF;
const QUERY_LOG_HEADER    = 0xFD;
const RESPONSE_HEADER_DAT = 0xFE;
const RESPONSE_HEADER_LOG = 0xFC;

const BLE_REMOTE_FORWARD     = 0xEB;
const BLE_REMOTE_BACKWARD    = 0xE9;
const BLE_REMOTE_TURN_LEFT   = 0xE7;
const BLE_REMOTE_TURN_RIGHT  = 0xE5;
const BLE_REMOTE_STOP        = 0xE3;
const BLE_REMOTE_FUNC_1      = 0xE1;
const BLE_REMOTE_FUNC_2      = 0xE0;

const IR_DIST_1 = 0xF1;
const IR_DIST_2 = 0xF2;
const IR_DIST_3 = 0xF3;

const BLE_REMOTE_2_FORWARD            = 0xDB;
const BLE_REMOTE_2_BACKWARD           = 0xD9;
const BLE_REMOTE_2_TURN_LEFT          = 0xD7;
const BLE_REMOTE_2_TURN_CIRCLE_LEFT   = 0xD6;
const BLE_REMOTE_2_TURN_RIGHT         = 0xD5;
const BLE_REMOTE_2_TURN_CIRCLE_RIGHT  = 0xD4;
const BLE_REMOTE_2_STOP               = 0xD3;

const RESPONSE_HEADER_POS = 0;
const HEX_COLOR_YELLOW = "#FFE599";
const HEX_COLOR_GREEN  = "#66bb6a";
const HEX_COLOR_RED    = "#ef5350";
const HEX_COLOR_BLUE   = "#42a5f5";
const HEX_COLOR_GRAY   = "#e0e0e0";

//functions
window.onload = function () {
  const device_name_field = document.getElementById("device_name");
  device_name_field.value = device_name_filter;
  const query_interval_field = document.getElementById("query_interval");
  query_interval_field.value = (query_interval === null) ? default_query_interval : query_interval;
  const data_points_field = document.getElementById("data_points");
  data_points_field.value = default_data_points;
  data_points = default_data_points;
  const remote_speed_up_field = document.getElementById("remote_speed_up");
  remote_speed_up_field.value = (remote_speed_up === null) ? default_IR_dist : remote_speed_up;
 // const IR_dist_select_field = document.getElementByName("IR_dist_select");
 // IR_dist_select_field.value = (IR_dist_select === null) ? default_IR_dist : IR_dist_select; 
  selectedTab = default_selected_tab;
  selectedDevice = default_selected_device;
  document.getElementById("btn_scan").style.backgroundColor       = HEX_COLOR_GREEN;
  document.getElementById("btn_disconnect").style.backgroundColor = HEX_COLOR_GRAY;
  document.getElementById("btn_reconnect").style.backgroundColor  = HEX_COLOR_GRAY;
  configCharts();

  updateTimer = setInterval(function () {
    //update gauge pitch
    if(chartGaugePitch) {
        let point = chartGaugePitch.series[0].points[0];
        point.update(newData.pitch);
    }

    //update gauge rpm l
    if(chartGaugeRPML) {
      let point = chartGaugeRPML.series[0].points[0];
      point.update(newData.rpm_l);
    }

    //update gauge rpm r
    if(chartGaugeRPMR) {
      let point = chartGaugeRPMR.series[0].points[0];
      point.update(newData.rpm_r);
    }

    //update vxvy
    if(chartVxvy) chartVxvy.series[0].addPoint([newData.vx, newData.vy], true, true);

    //update pitch
    if(chartPitch) chartPitch.series[0].addPoint([(new Date()).getTime(), newData.pitch], true, true);

    //update intent
    if(chartIntent) chartIntent.series[0].addPoint([(new Date()).getTime(), newData.intent], true, true);

    //update current left
    if(chartCurrentL) chartCurrentL.series[0].addPoint([(new Date()).getTime(), newData.current_l], true, true);

    //update current right
    if(chartCurrentR) chartCurrentR.series[0].addPoint([(new Date()).getTime(), newData.current_r], true, true);

    //update rpm left
    if(chartRPML) chartRPML.series[0].addPoint([(new Date()).getTime(), newData.rpm_l], true, true);

    //update rpm right
    if(chartRPMR) chartRPMR.series[0].addPoint([(new Date()).getTime(), newData.rpm_r], true, true);

    //update vx/vy
    if(chartVx) chartVx.series[0].addPoint([(new Date()).getTime(), newData.vx], true, true);
    if(chartVx) chartVx.series[1].addPoint([(new Date()).getTime(), newData.vy], true, true);

    //update label pitch value
    document.getElementById("label-pitch-raw").innerHTML = (newData.pitch_datum + newData.pitch).toFixed(2);

    //update label pitch datum
    document.getElementById("label-pitch-datum").innerHTML = newData.pitch_datum;

    //update label force level
    document.getElementById("label-force-level").innerHTML = newData.force_level;

    //update label speed decrease
    document.getElementById("label-speed-decrease").innerHTML = newData.spd_dec;

    //update label speed plus
    document.getElementById("label-speed-plus").innerHTML = newData.spd_pls;

    //update label factor plus
    document.getElementById("label-factor-plus").innerHTML = newData.fac_pls;

    //update label factor minus
    document.getElementById("label-factor-minus").innerHTML = newData.fac_mns;
    document.getElementById("label-IR-FY").innerHTML = newData.IR_FY;
    //update switch status
    document.getElementById("sw_lf").className = (newData.sw_lf == 0) ? "dot dotGreen" : "dot";
    document.getElementById("sw_lb").className = (newData.sw_lb == 0) ? "dot dotGreen" : "dot";
    document.getElementById("sw_rf").className = (newData.sw_rf == 0) ? "dot dotGreen" : "dot";
    document.getElementById("sw_rb").className = (newData.sw_rb == 0) ? "dot dotGreen" : "dot";

  }, (query_interval === null) ? default_query_interval : query_interval);
}

function radioChange(object) {
  selectedTab = parseInt(object.value);
  console.log('radio change: ' + selectedTab);
  startQueryTimer();
}

function getCheckboxValue(d_select) {
  selectedDevice = parseInt(d_select.value);
}
function get_IR_CheckboxValue(IR_select) {
  IR_dist_select_field = parseInt(IR_select.value);
  setIRdistance();
}

function startQueryTimer() {
  queryTimer = setInterval(() => {
    if(selectedTab === 1) {
      let aBuffer_data = new ArrayBuffer(1);
      let dataView_data = new DataView(aBuffer_data);
      dataView_data.setUint8(0, QUERY_DATA_HEADER);

      TXcharacteristic.writeValue(aBuffer_data)
      .then(() => {
        //console.log('writeValue ok');
      })
      .catch(error => {
        //console.log('writeValue error: ' + error);
      });
    } else if (selectedTab === 2) {
      clearInterval(queryTimer);
    }
  }, (query_interval === null) ? default_query_interval : query_interval);
}

function onScanButtonClick() {
  console.log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice({
      //acceptAllDevices: true,
      filters: [{
        name: device_name_filter
      }],
      optionalServices: [serviceUUID]
    })
    .then(device => {
      console.log('> Name:             ' + device.name);
      console.log('> Id:               ' + device.id);
      console.log('> Connected:        ' + device.gatt.connected);

      bluetoothDevice = device;
      bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
      connect();
    })
    .catch(error => {
      console.log('requestDevice error: ' + error);
    });
}

function onScanButtonClick2() {
  console.log('Requesting Bluetooth Device...');
  navigator.bluetooth.requestDevice({
      //acceptAllDevices: true,
      filters: [{
        name: device_name_filter
      }],
      optionalServices: [serviceUUID2]
    })
    .then(device2 => {
      console.log('> Name:             ' + device2.name);
      console.log('> Id:               ' + device2.id);
      console.log('> Connected:        ' + device2.gatt.connected);

      bluetoothDevice2 = device2;
      bluetoothDevice2.addEventListener('gattserverdisconnected2', onDisconnected2);
      connect2();
    })
    .catch(error => {
      console.log('requestDevice error: ' + error);
    });
}


function connect() {
  document.getElementById("query_interval").disabled = true;

  console.log('Connecting to Bluetooth Device...');
  bluetoothDevice.gatt.connect()
    .then(server => {
      console.log('> Bluetooth Device connected');
      console.log('>> Name:             ' + server.device.name);
      console.log('>> Id:               ' + server.device.id);
      console.log('>> Connected:        ' + server.device.gatt.connected);
      console.log('>> Server connected: ' + server.connected);
      return server.getPrimaryService(serviceUUID);
    })
    .then(service => {
      console.log('>>> Service uuid:      ' + service.uuid);
      console.log('>>> Service isPrimary: ' + service.isPrimary);
      console.log('Service found, getting characteristic...');
      return service.getCharacteristics();
    })
    .then(characteristics => {
      console.log('characteristics found, getting characteristic...');
      characteristics.forEach((characteristic, index) => {
        console.log('>>>> Characteristics #' + (index + 1));
        console.log('>>>> Characteristics uuid:  ' + characteristic.uuid);
        console.log('>>>> Characteristics read:  ' + characteristic.properties.read);
        console.log('>>>> Characteristics write: ' + characteristic.properties.write);
      });
      TXcharacteristic = characteristics[0];
      RXcharacteristic = characteristics[1];

      RXcharacteristic.startNotifications()
        .then(() => {
          document.getElementById("btn_scan").disabled       = true;
          document.getElementById("btn_scan").style.backgroundColor       = HEX_COLOR_GRAY;
          document.getElementById("btn_disconnect").disabled = false;
          document.getElementById("btn_disconnect").style.backgroundColor = HEX_COLOR_RED;
          document.getElementById("btn_reconnect").disabled  = true;
          document.getElementById("btn_reconnect").style.backgroundColor  = HEX_COLOR_GRAY;

          console.log('Notifications started');
          RXcharacteristic.addEventListener('characteristicvaluechanged', parseData);

          startQueryTimer();
        });

    })
    .catch(error => {
      console.log('connect error: ' + error);
    });;
}

function connect2() {
  document.getElementById("query_interval").disabled = true;

  console.log('Connecting to Bluetooth Device...');
  bluetoothDevice2.gatt.connect()
    .then(server => {
      console.log('> Bluetooth Device connected');
      console.log('>> Name:             ' + server.device.name);
      console.log('>> Id:               ' + server.device.id);
      console.log('>> Connected:        ' + server.device.gatt.connected);
      console.log('>> Server connected: ' + server.connected);
      return server.getPrimaryService(serviceUUID);
    })
    .then(service => {
      console.log('>>> Service uuid:      ' + service.uuid);
      console.log('>>> Service isPrimary: ' + service.isPrimary);
      console.log('Service found, getting characteristic...');
      return service.getCharacteristics();
    })
    .then(characteristics => {
      console.log('characteristics found, getting characteristic...');
      characteristics.forEach((characteristic, index) => {
        console.log('>>>> Characteristics #' + (index + 1));
        console.log('>>>> Characteristics uuid:  ' + characteristic.uuid2);
        console.log('>>>> Characteristics read:  ' + characteristic.properties.read);
        console.log('>>>> Characteristics write: ' + characteristic.properties.write);
      });
      TXcharacteristic2 = characteristics[0];
      RXcharacteristic2 = characteristics[1];

      RXcharacteristic2.startNotifications()
        .then(() => {
          document.getElementById("btn_scan_2").disabled       = true;
          document.getElementById("btn_scan_2").style.backgroundColor       = HEX_COLOR_GRAY;
          document.getElementById("btn_disconnect_2").disabled = false;
          document.getElementById("btn_disconnect_2").style.backgroundColor = HEX_COLOR_RED;
          document.getElementById("btn_reconnect").disabled  = true;
          document.getElementById("btn_reconnect").style.backgroundColor  = HEX_COLOR_GRAY;

          console.log('Notifications started');
          RXcharacteristic.addEventListener('characteristicvaluechanged2', parseData);

          startQueryTimer();
        });

    })
    .catch(error => {
      console.log('connect error: ' + error);
    });;
}


function onDisconnectButtonClick() {
  if (!bluetoothDevice) {
    return;
  }
  console.log('Disconnecting from Bluetooth Device...');
  if (bluetoothDevice.gatt.connected) {
    bluetoothDevice.gatt.disconnect();
  } else {
    console.log('> Bluetooth Device is already disconnected');
  }
}

function onDisconnectButtonClick2() {
  if (!bluetoothDevice2) {
    return;
  }
  console.log('Disconnecting from Bluetooth Device...');
  if (bluetoothDevice2.gatt.connected) {
    bluetoothDevice2.gatt.disconnect();
    onDisconnected2();
  } else {
    console.log('> Bluetooth Device is already disconnected2');
  }
}
function onDisconnected(event) {
  // Object event.target is Bluetooth Device getting disconnected.
  document.getElementById("query_interval").disabled = false;
  document.getElementById("btn_scan").disabled       = false;
  document.getElementById("btn_scan").style.backgroundColor       = HEX_COLOR_GREEN;
  document.getElementById("btn_disconnect").disabled = true;
  document.getElementById("btn_disconnect").style.backgroundColor = HEX_COLOR_GRAY;
  document.getElementById("btn_reconnect").disabled  = false;
  document.getElementById("btn_reconnect").style.backgroundColor  = HEX_COLOR_BLUE;

  clearData();
  console.log('> Bluetooth Device disconnected');
  window.alert("Bluetooth Device is already disconnected");
}

function onDisconnected2(event) {
  // Object event.target is Bluetooth Device getting disconnected.
 //bdocument.getElementById("query_interval").disabled = false;
  document.getElementById("btn_scan_2").disabled       = false;
  document.getElementById("btn_scan_2").style.backgroundColor       = HEX_COLOR_YELLOW;
  document.getElementById("btn_disconnect_2").disabled = true;
  document.getElementById("btn_disconnect_2").style.backgroundColor = HEX_COLOR_GRAY;
  document.getElementById("btn_reconnect").disabled  = false;
  document.getElementById("btn_reconnect").style.backgroundColor    = HEX_COLOR_BLUE;

 // clearData();
  console.log('> Bluetooth Device disconnected');
  window.alert("Bluetooth Device is already disconnected2");
}


function onReconnectButtonClick() {
  if (!bluetoothDevice) {
    return;
  }
  if (bluetoothDevice.gatt.connected) {
    console.log('> Bluetooth Device is already connected');
    return;
  }
  connect();
}


function onQueryLogButtonClick() {
  let aBuffer_log = new ArrayBuffer(1);
  let dataView_log = new DataView(aBuffer_log);
  dataView_log.setUint8(0, QUERY_LOG_HEADER);

  TXcharacteristic.writeValue(aBuffer_log)
  .then(() => {
    //console.log('writeValue ok');
  })
  .catch(error => {
    //console.log('writeValue error: ' + error);
  });
}





function on_remote_fw_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_FORWARD);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

function on_remote_bk_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_BACKWARD );
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}
function on_remote_L_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_TURN_LEFT);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

function on_remote_R_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_TURN_RIGHT);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

function on_remote_stop_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_STOP);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}


function on_remote_Demo_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_FUNC_1);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

////////////////////////////Remote_2_function//////////////////////////

function on_remote_2_fw_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_2_FORWARD);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

function on_remote_2_bk_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_2_BACKWARD );
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}
function on_remote_2_L_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_2_TURN_LEFT);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

function on_remote_2_L_circle_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_2_TURN_CIRCLE_LEFT);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

function on_remote_2_R_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_2_TURN_RIGHT);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  }

function on_remote_2_R_circle_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_2_TURN_CIRCLE_RIGHT);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

function on_remote_2_stop_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_2_STOP);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

function on_remote_func_2_ButtonClick() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, BLE_REMOTE_FUNC_2);
  if(selectedDevice == 0 || selectedDevice == 1)
  {
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
  if (selectedDevice == 0 || selectedDevice == 2)
  {
    TXcharacteristic2.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
  }
}

////////////////////////Remote_2_function_End//////////////////////////



function setQueryInterval() {
  const newInterval = parseInt(document.getElementById("query_interval").value);
  console.log("Set interval: " + newInterval);
  query_interval = newInterval;
}

function setDataPointNum() {
  const newDataPointNum = parseInt(document.getElementById("data_points").value);
  console.log("Set data points: " + newDataPointNum);
  data_points = newDataPointNum;
}

function setSpeedUpNum() {
  const newSpeedUPNum = parseInt(document.getElementById("remote_speed_up").value);
  console.log("Set speed up: " + newSpeedUPNum);
  remote_speed_up = newSpeedUPNum;

  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
  dataView_remote.setUint8(0, remote_speed_up);

  TXcharacteristic.writeValue(aBuffer_remote)
  .then(() => {
    //console.log('writeValue ok');
  })
  .catch(error => {
    //console.log('writeValue error: ' + error);
  });
  TXcharacteristic2.writeValue(aBuffer_remote)
  .then(() => {
    //console.log('writeValue ok');
  })
  .catch(error => {
    //console.log('writeValue error: ' + error);
  });
}

function setIRdistance() {
  let aBuffer_remote = new ArrayBuffer(1);
  let dataView_remote = new DataView(aBuffer_remote);
switch(IR_dist_select_field)
{
  case 1:
  dataView_remote.setUint8(0, IR_DIST_1);
  break;
  case 3:
  dataView_remote.setUint8(0, IR_DIST_3);
  break;
  default:
  case 2:
  dataView_remote.setUint8(0, IR_DIST_2);
  break;
}
    TXcharacteristic.writeValue(aBuffer_remote)
    .then(() => {
      //console.log('writeValue ok');
    })
    .catch(error => {
      //console.log('writeValue error: ' + error);
    });
}


function clearData() {
  newData.pitch_datum = 0;
  newData.force_level = 0;
  newData.pitch = 0;
  newData.intent = 0;
  newData.current_l = 0;
  newData.current_r = 0;
  newData.rpm_l = 0;
  newData.rpm_r = 0;
  newData.vx = 0;
  newData.vy = 0;
  newData.sw_lf = 1;
  newData.sw_lb = 1;
  newData.sw_rf = 1;
  newData.sw_rb = 1;
  newData.spd_dec = 0;
  newData.spd_pls = 0;
  newData.fac_pls = 0;
  newData.fac_mns = 0;
  newData.BLE_FLAG = 0;
  newData.IR_FY = 0;
}

function parseData(event) {
  if (RXcharacteristic) {

    const dataView = new DataView(RXcharacteristic.value.buffer);
    let dataviewArray = [];
    for (let idx = 0; idx < 100; idx++) {
      dataviewArray.push(dataView.getUint8(idx));
    }

    if (selectedTab == 1) {
      let data_array = getStringFromBytes(dataView);
      if(data_array != undefined) {
        newData.pitch = parseFloat(data_array[0]);
        newData.pitch_datum = parseFloat(data_array[1]);
        newData.force_level = parseInt(data_array[2])
        newData.intent = parseInt(data_array[3]);
        newData.current_l = parseFloat(data_array[5]);
        newData.current_r = parseFloat(data_array[8]);
        newData.rpm_l = parseInt(data_array[6]);
        newData.rpm_r = parseInt(data_array[9]);
        newData.vx = parseFloat(data_array[10]);
        newData.vy = parseFloat(data_array[11]);
        newData.spd_dec = parseFloat(data_array[12]);
        newData.spd_pls = parseFloat(data_array[13]);
        newData.fac_pls = parseFloat(data_array[14]);
        newData.fac_mns = parseFloat(data_array[15]);
        newData.sw_lf = parseInt(data_array[16]);
        newData.sw_rf = parseInt(data_array[17]);
        newData.sw_lb = parseInt(data_array[18]);
        newData.sw_rb = parseInt(data_array[19]);
        newData.BLE_FLAG = parseInt(data_array[20]);
        newData.IR_FY = parseInt(data_array[21]);
      }} else if(selectedTab ==2) {
        let logData = getLogFromBytes(dataView);
        var str = '<ol type="1">'

        logData.forEach(function(logEvent) {
          str += '<li>'+ logEvent + '</li>';
        }); 

        str += '</ol>';
        document.getElementById("logListContainer").innerHTML = str;
      }
    //}
  }
}

function getStringFromBytes(dataView) {
  //check header
  if(dataView.getUint8(RESPONSE_HEADER_POS) != RESPONSE_HEADER_DAT) return;

  //extract data
  let char_array = [];
  for (let i = 1; i < 100; i++) {
    const ascii_value = dataView.getUint8(i);
    char_array.push(ascii_value);
  }

  const resultStr = String.fromCharCode.apply(String, char_array).replace(/\0/g, '').replace(/\r/g, '');
  const resultArray = resultStr.split(',');
  console.log("response: " + JSON.stringify(resultArray));
  return resultArray;
}

function getLogFromBytes(dataView) {
  //check header
  if(dataView.getUint8(RESPONSE_HEADER_POS) != RESPONSE_HEADER_LOG) return;

  //extract data
  result_array = [];
  const bytes_in_one_package = 5;
  for (let i = 1; i < default_log_number_return * bytes_in_one_package; i += bytes_in_one_package) {
    const timeStamp = dataView.getUint32(i);
    const logValue  = dataView.getUint8(i+4);
    result_array.push("timestamp: " + timeStampToString(timeStamp) + " : " + getLogStrFromValue(logValue));
  }
  return result_array;
}

function timeStampToString (time){
  var datetime = new Date();
   datetime.setTime(time);
   var year = datetime.getFullYear();
   var month = datetime.getMonth() + 1;
   var date = datetime.getDate();
   var hour = datetime.getHours();
   var minute = datetime.getMinutes();
   var second = datetime.getSeconds();
   var mseconds = datetime.getMilliseconds();
   return year + "-" + month + "-" + date+" "+hour+":"+minute+":"+second+"."+mseconds;
}

function getLogStrFromValue(logValue) {
  const logObj = log_define.find((item) => item.value === logValue);
  console.log("logValue: " + logValue + "logObj: " + JSON.stringify(logObj));
  if(logObj === undefined) return ("log value not found: " + logValue)
  else return logObj.key;
}

function configCharts() {
  //Pitch
  chartPitch = Highcharts.chart('pitch', {
    colors: ['#7CB5EC'],
    chart: {
      type: 'spline',
      animation: Highcharts.svg
    },
    time: {
      useUTC: false
    },
    title: {
      text: 'Pitch'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: x_label_interval
    },
    yAxis: {
      title: {
        text: 'Value'
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }],
      //max: 90,
      //min: -90
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Pitch',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -data_points; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });

  //Intent
  chartIntent = Highcharts.chart('intent', {
    colors: ['#71c3ae'],
    chart: {
      type: 'spline',
      animation: Highcharts.svg
    },
    time: {
      useUTC: false
    },
    title: {
      text: 'Intent'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: x_label_interval
    },
    yAxis: {
      categories: ['No touch', 'Forward', 'Backward', 'Boost', 'Pivot Left', 'Pivot Right'],
      title: {
        text: 'Intent'
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }],
      max: 5,
      min: 0
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Intent',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -data_points; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });

  //current_l
  chartCurrentL = Highcharts.chart('current_l', {
    colors: ['#7186c3'],
    chart: {
      type: 'spline',
      animation: Highcharts.svg
    },
    time: {
      useUTC: false
    },
    title: {
      text: 'Current Left'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: x_label_interval
    },
    yAxis: {
      title: {
        text: 'Value'
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }],
      //max: 90,
      //min: -90
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Current Left',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -data_points; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });

  //current_r
  chartCurrentR = Highcharts.chart('current_r', {
    colors: ['#7186c3'],
    chart: {
      type: 'spline',
      animation: Highcharts.svg
    },
    time: {
      useUTC: false
    },
    title: {
      text: 'Current Right'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: x_label_interval
    },
    yAxis: {
      title: {
        text: 'Value'
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }],
      //max: 90,
      //min: -90
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Current Right',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -data_points; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });

  //rpm_l
  chartRPML = Highcharts.chart('rpm_l', {
    colors: ['#71afc3'],
    chart: {
      type: 'spline',
      animation: Highcharts.svg
    },
    time: {
      useUTC: false
    },
    title: {
      text: 'RPM Left'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: x_label_interval
    },
    yAxis: {
      title: {
        text: 'Value'
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }],
      //max: 90,
      //min: -90
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'RPM Left',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -data_points; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });

  //rpm_r
  chartRPMR = Highcharts.chart('rpm_r', {
    colors: ['#71afc3'],
    chart: {
      type: 'spline',
      animation: Highcharts.svg
    },
    time: {
      useUTC: false
    },
    title: {
      text: 'RPM Right'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: x_label_interval
    },
    yAxis: {
      title: {
        text: 'Value'
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }],
      //max: 90,
      //min: -90
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'RPM Right',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -data_points; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });

  //Vx
  chartVx = Highcharts.chart('vx', {
    colors: ['#009688', '#ff8a65'],
    chart: {
      type: 'spline',
      animation: Highcharts.svg
    },
    time: {
      useUTC: false
    },
    title: {
      text: 'Voltage X / Y'
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: x_label_interval
    },
    yAxis: {
      title: {
        text: 'Value'
      },
      plotLines: [{
        value: 0,
        width: 1,
        color: '#808080'
      }],
      max: 5,
      min: 0
    },
    tooltip: {
      headerFormat: '<b>{series.name}</b><br/>',
      pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
    },
    legend: {
      enabled: true
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'vx',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -data_points; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    },
    {
      name: 'vy',
      data: (function () {
        // generate an array of random data
        var data = [],
          time = (new Date()).getTime(),
          i;

        for (i = -data_points; i <= 0; i += 1) {
          data.push({
            x: time + i * 1000,
            y: 0
          });
        }
        return data;
      }())
    }]
  });

  chartVxvy = Highcharts.chart('vxvy', {
    colors: ['#009688'],
    chart: {
      type: 'scatter',
      zoomType: 'xy'
    },
    title: {
      text: 'Joystick position'
    },
    xAxis: {
      title: {
        enabled: true,
        text: 'Voltage (V)'
      },
      max: 5,
      min: 0,
      plotLines:[{
        color:'gray',
        dashStyle:'solid',
        value:2.5,
        width:2
      }]
    },
    yAxis: {
      title: {
        text: 'Voltage (V)'
      },
      max: 5,
      min: 0,
      plotLines:[{
        color:'gray',
        dashStyle:'solid',
        value:2.5,
        width:2
      }]
    },
    plotOptions: {
      scatter: {
        marker: {
          radius: 5,
          states: {
            hover: {
              enabled: true,
              lineColor: 'rgb(100,100,100)'
            }
          }
        },
        states: {
          hover: {
            marker: {
              enabled: false
            }
          }
        },
        tooltip: {
          headerFormat: '<b>{series.name}</b><br>',
          pointFormat: '{point.x} V, {point.y} V'
        }
      }
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Joystick',
      data: (function () {
        // generate data
        let data = [[newData.vx, newData.vy]];
        return data;
      }())
    }]
  });

  var gaugeOptions = {
    chart: {
        type: 'solidgauge'
    },
    title: null,
    pane: {
        center: ['50%', '85%'],
        size: '140%',
        startAngle: -90,
        endAngle: 90,
        background: {
            backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc'
        }
    },
    tooltip: {
        enabled: false
    },
    // the value axis
    yAxis: {
        stops: [
            [0.1, '#55BF3B'], // green
            [0.5, '#DDDF0D'], // yellow
            [0.9, '#DF5353'] // red
        ],
        lineWidth: 0,
        minorTickInterval: null,
        tickAmount: 2,
        title: {
            y: -70
        },
        labels: {
            y: 16
        }
    },
    plotOptions: {
        solidgauge: {
            dataLabels: {
                y: 5,
                borderWidth: 0,
                useHTML: true
            }
        }
    }
  };

  chartGaugePitch = Highcharts.chart('gauge-pitch', Highcharts.merge(gaugeOptions, {
    yAxis: {
      min: -30,
      max: 30,
      title: {
        text: 'Pitch'
      }
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'Pitch',
      data: [0],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:25px;color:' +
          ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
             '<span style="font-size:12px;color:silver">degree</span></div>'
      },
      tooltip: {
        valueSuffix: ' degree'
      }
    }]
  }));

  chartGaugeRPML = Highcharts.chart('gauge-rpm-l', Highcharts.merge(gaugeOptions, {
    yAxis: {
      min: -500,
      max: 500,
      title: {
        text: 'RPM Left'
      }
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'RPM_L',
      data: [0],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:25px;color:' +
          ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
             '<span style="font-size:12px;color:silver">rpm</span></div>'
      },
      tooltip: {
        valueSuffix: ' rpm'
      }
    }]
  }));

  chartGaugeRPMR = Highcharts.chart('gauge-rpm-r', Highcharts.merge(gaugeOptions, {
    yAxis: {
      min: -500,
      max: 500,
      title: {
        text: 'RPM Right'
      }
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [{
      name: 'RPM_R',
      data: [0],
      dataLabels: {
        format: '<div style="text-align:center"><span style="font-size:25px;color:' +
          ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/>' +
             '<span style="font-size:12px;color:silver">rpm</span></div>'
      },
      tooltip: {
        valueSuffix: ' rpm'
      }
    }]
  }));
}

const log_define = [
  {
    "key": "Power on",
    "value": 0x01
  },
  {
    "key": "Power off",
    "value": 0x02
  },
  {
    "key": "Battery 100",
    "value": 0x03
  },
  {
    "key": "Battery 90",
    "value": 0x04
  },
  {
    "key": "Battery 80",
    "value": 0x05
  },
  {
    "key": "Battery 70",
    "value": 0x06
  },
  {
    "key": "Battery 60",
    "value": 0x07
  },
  {
    "key": "Battery 50",
    "value": 0x08
  },
  {
    "key": "Battery 40",
    "value": 0x09
  },
  {
    "key": "Battery 30",
    "value": 0x0A
  },
  {
    "key": "Battery 20",
    "value": 0x0B
  },
  {
    "key": "Battery 10",
    "value": 0x0C
  },
  {
    "key": "Adapter plugin",
    "value": 0x0D
  },
  {
    "key": "Adapter pull out",
    "value": 0x0E
  },
  {
    "key": "Mode transform init",
    "value": 0x11
  },
  {
    "key": "Mode transform start",
    "value": 0x12
  },
  {
    "key": "Mode transform finish",
    "value": 0x13
  },
  {
    "key": "Mode strolling init",
    "value": 0x15
  },
  {
    "key": "Mode strolling start",
    "value": 0x16
  },
  {
    "key": "Mode strolling finish",
    "value": 0x17
  },
  {
    "key": "Mode driving init",
    "value": 0x19
  },
  {
    "key": "Mode driving start",
    "value": 0x1A
  },
  {
    "key": "Mode driving finish",
    "value": 0x1B
  },
  {
    "key": "Mode unknown",
    "value": 0x1D
  },
  {
    "key": "Transform button trigger",
    "value": 0x21
  },
  {
    "key": "Transform start",
    "value": 0x22
  },
  {
    "key": "Transform lock",
    "value": 0x23
  },
  {
    "key": "Transform unlock",
    "value": 0x24
  },
  {
    "key": "Transform drive to stroll",
    "value": 0x25
  },
  {
    "key": "Transform stroll to drive",
    "value": 0x26
  },
  {
    "key": "Transform cancel",
    "value": 0x27
  },
  {
    "key": "Transform finish",
    "value": 0x28
  },
  {
    "key": "Transform timeout",
    "value": 0x29
  },
  {
    "key": "Transform step loss",
    "value": 0x2A
  },
  {
    "key": "Key on",
    "value": 0x2D
  },
  {
    "key": "Key off",
    "value": 0x2E
  },
  {
    "key": "Btn power key down",
    "value": 0x31
  },
  {
    "key": "Btn stroll down",
    "value": 0x32
  },
  {
    "key": "Btn drive down",
    "value": 0x33
  },
  {
    "key": "Switch stroll touch",
    "value": 0x35
  },
  {
    "key": "Switch stroll leave",
    "value": 0x36
  },
  {
    "key": "Switch stroll 2nd touch",
    "value": 0x37
  },
  {
    "key": "Switch stroll 2nd leave",
    "value": 0x38
  },
  {
    "key": "Switch drive touch",
    "value": 0x39
  },
  {
    "key": "Switch drive leave",
    "value": 0x3A
  },
  {
    "key": "Switch arm connect touch",
    "value": 0x3B
  },
  {
    "key": "Switch arm connect leave",
    "value": 0x3C
  },
  {
    "key": "Switch wheel connect touch",
    "value": 0x3D
  },
  {
    "key": "Switch wheel connect leave",
    "value": 0x3E
  },
  {
    "key": "Stroll throttle on",
    "value": 0x41
  },
  {
    "key": "Stroll throttle off",
    "value": 0x42
  },
  {
    "key": "Stroll direction forward",
    "value": 0x43
  },
  {
    "key": "Stroll direction backward",
    "value": 0x44
  },
  {
    "key": "Stroll boost on",
    "value": 0x45
  },
  {
    "key": "Stroll boost off",
    "value": 0x46
  },
  {
    "key": "Switch L front touch",
    "value": 0x47
  },
  {
    "key": "Switch L front leave",
    "value": 0x48
  },
  {
    "key": "Switch L back touch",
    "value": 0x49
  },
  {
    "key": "Switch L back leave",
    "value": 0x4A
  },
  {
    "key": "Switch R front touch",
    "value": 0x4B
  },
  {
    "key": "Switch R front leave",
    "value": 0x4C
  },
  {
    "key": "Switch R back touch",
    "value": 0x4D
  },
  {
    "key": "Switch R back leave",
    "value": 0x4E
  },
  {
    "key": "Switch capacitor on",
    "value": 0x4F
  },
  {
    "key": "Switch capacitor off",
    "value": 0x50
  },
  {
    "key": "Drive joystick center",
    "value": 0x52
  },
  {
    "key": "Drive joystick not center",
    "value": 0x53
  },
  {
    "key": "SPEED_LV_1",
    "value": 0x58
  },
  {
    "key": "SPEED_LV_2",
    "value": 0x59
  },
  {
    "key": "SPEED_LV_3",
    "value": 0x5A
  },
  {
    "key": "SPEED_LV_4",
    "value": 0x5B
  },
  {
    "key": "SPEED_LV_5",
    "value": 0x5C
  },
  {
    "key": "SPI1_ERROR_MODF",
    "value": 0x61
  },
  {
    "key": "SPI1_ERROR_CRC",
    "value": 0x62
  },
  {
    "key": "SPI1_ERROR_OVR",
    "value": 0x63
  },
  {
    "key": "SPI1_ERROR_FRE",
    "value": 0x64
  },
  {
    "key": "SPI1_ERROR_DMA",
    "value": 0x65
  },
  {
    "key": "SPI1_ERROR_FLAG",
    "value": 0x66
  },
  {
    "key": "SPI3_ERROR_MODF",
    "value": 0x68
  },
  {
    "key": "SPI3_ERROR_CRC",
    "value": 0x69
  },
  {
    "key": "SPI3_ERROR_OVR",
    "value": 0x6A
  },
  {
    "key": "SPI3_ERROR_FRE",
    "value": 0x6B
  },
  {
    "key": "SPI3_ERROR_DMA",
    "value": 0x6C
  },
  {
    "key": "SPI3_ERROR_FLAG",
    "value": 0x6D
  },
  {
    "key": "UART1_ERROR_PE",
    "value": 0x81
  },
  {
    "key": "UART1_ERROR_NE",
    "value": 0x82
  },
  {
    "key": "UART1_ERROR_FE",
    "value": 0x83
  },
  {
    "key": "UART1_ERROR_ORE",
    "value": 0x84
  },
  {
    "key": "UART1_ERROR_DMA",
    "value": 0x85
  },
  {
    "key": "UART2_ERROR_PE",
    "value": 0x87
  },
  {
    "key": "UART2_ERROR_NE",
    "value": 0x88
  },
  {
    "key": "UART2_ERROR_FE",
    "value": 0x89
  },
  {
    "key": "UART2_ERROR_ORE",
    "value": 0x8A
  },
  {
    "key": "UART2_ERROR_DMA",
    "value": 0x8B
  },
  {
    "key": "UART3_ERROR_PE",
    "value": 0x91
  },
  {
    "key": "UART3_ERROR_NE",
    "value": 0x92
  },
  {
    "key": "UART3_ERROR_FE",
    "value": 0x93
  },
  {
    "key": "UART3_ERROR_ORE",
    "value": 0x94
  },
  {
    "key": "UART3_ERROR_DMA",
    "value": 0x95
  },
  {
    "key": "UART6_ERROR_PE",
    "value": 0x97
  },
  {
    "key": "UART6_ERROR_NE",
    "value": 0x98
  },
  {
    "key": "UART6_ERROR_FE",
    "value": 0x99
  },
  {
    "key": "UART6_ERROR_ORE",
    "value": 0x9A
  },
  {
    "key": "UART6_ERROR_DMA",
    "value": 0x9B
  },
  {
    "key": "Security person seated",
    "value": 0xA1
  },
  {
    "key": "Security car moving",
    "value": 0xA2
  }
];
