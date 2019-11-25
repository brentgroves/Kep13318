const opcua = require('node-opcua');
const mqtt = require('mqtt');
const config = require('../Config13318/config.json');
//https://github.com/node-opcua/node-opcua/blob/master/packages/node-opcua-client/source/opcua_client.ts
const endpointUrl = config.OPCUA;
// 'opc.tcp://10.1.2.37:49321';
// 'opc.tcp://BUSCHE-ALB-KORS.BUSCHE-CNC.com:49321';
// 'opc.tcp://BUSCHE-ALB-KORS.BUSCHE-CNC.com:49320';
// 'opc.tcp://bgroves-desk:49320'; // very slow on home wifi
// 'opc.tcp://bgroves_desk.busche-cnc.com:49320';
// 'opc.tcp://192.168.254.15:49320';
// 'opc.tcp://10.1.1.193:49320';
// const endpointUrl = "opc.tcp://" + require("os").hostname() + ":48010";

async function main() {
  try {
    const mqttClient = mqtt.connect(`${config.MQTT}`);
    const client = opcua.OPCUAClient.create({
      endpoint_must_exist: false,
    });
    client.on('backoff', (retry, delay) =>
      console.log(
        'still trying to connect to ',
        endpointUrl,
        ': retry =',
        retry,
        'next attempt in ',
        delay / 1000,
        'seconds',
      ),
    );

    await client.connect(endpointUrl);
    const session = await client.createSession();

    const subscriptionOptions = {
      maxNotificationsPerPublish: 1000,
      publishingEnabled: true,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      requestedPublishingInterval: 1000,
    };

    const subscription = await session.createSubscription2(subscriptionOptions);
    subscription
      .on('started', () =>
        console.log(
          'subscription started - subscriptionId=',
          subscription.subscriptionId,
        ),
      )
      // .on('keepalive', () => console.log('keepalive'))
      .on('terminated', () => console.log('subscription terminated'));

    // http://node-opcua.github.io/api_doc/2.0.0/classes/clientsubscription.html#monitor
    var monitoredItem = [];
    for (let i = 0; i < config.NodeId.length; i++) {
      let mi = await subscription.monitor(
        {
          nodeId: config.NodeId[i].NodeId,
          attributeId: opcua.AttributeIds.Value,
          indexRange: null,
          dataEncoding: {namespaceIndex: 0, name: null},
        },
        {
          samplingInterval: 3000,
          filter: null,
          queueSize: 1,
          discardOldest: true,
        },
        opcua.TimestampsToReturn.Both, // These values are in GMT.
      );
      monitoredItem.push(mi);
      monitoredItem[i].on('changed', dataValue => {
        let date_ob = new Date();
        let date = ('0' + date_ob.getDate()).slice(-2);
        let month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
        let year = date_ob.getFullYear();
        let hours = date_ob.getHours();
        let minutes = date_ob.getMinutes();
        let seconds = date_ob.getSeconds();
        let TransDate = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

        let Cycle_Counter_Shift_SL = parseInt(dataValue.value.value.toString());
        let msg = {
          PCN: config.NodeId[i].PCN,
          TransDate: TransDate,
          WorkCenter: config.NodeId[i].WorkCenter,
          NodeId: config.NodeId[i].NodeId,
          Cycle_Counter_Shift_SL: Cycle_Counter_Shift_SL,
        };
        let msgString = JSON.stringify(msg);
        console.log(msg);
        mqttClient.publish('Kep13318', msgString);
      });
    }
  } catch (err) {
    console.log('Error !!!', err);
  }
}

main();
