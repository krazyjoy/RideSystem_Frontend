

<script>
import axios from 'axios'
// import GMap from './Gmap.vue'
import {v4} from 'uuid';
import driver_addr from '/src/driver_addr.json'
// import * as SockJS from 'sockjs-client'
// import Stomp from 'stompjs';
import * as mqtt from 'mqtt/dist/mqtt.min';
import Waiting from './waiting.vue';
import router from '../route'
export default {
      name: "rides-view_orig",
      data() {
          return {
            // mqtt https://www.emqx.com/en/blog/how-to-use-mqtt-in-vue
              mqtt_group_driver:{
                  connection:{
                      protocol: 'ws',
                      host: '192.168.12.218',
                      port: '8083',
                      endpoint:'/mqtt',
                      clean: false,
                      connectTimeout: 30 * 1000,
                      reconnectPeriod: 4000,
                      clientId: localStorage.getItem('user_id') + "_" + v4(),
                      username: 'admin',
                      password: 'public',
                      subscribeSuccess: false,
                      connecting: false,
                      retryTimes: 0,
                  },

                  subscription:{
                      topic: localStorage.getItem('channel'),
                      qos: 2
                  },
                  subscribe:{
                      doSubscribe: false,
                      doUnSubscribe: false
                  },
                  publish:{
                      doPublish: true,
                      topic:'',
                      qos: 2,
                      payload: ''
                  },
                  driver:{
                      connected: false,
                  },
                  receiveNews: []
              },
              mqtt_group_client:{
                  connection:{
                      protocol: 'ws',
                      host: '192.168.12.218',
                      port: '8083',
                      endpoint:'/mqtt',
                      clean: false,
                      connectTimeout: 30 * 1000,
                      reconnectPeriod: 4000,
                      clientId: localStorage.getItem('user_id') + "_" + v4(),
                      username: 'admin',
                      password: 'public',
                      subscribeSuccess: false,
                      connecting: false,
                      retryTimes: 0,
                  },

                  subscription:{
                      topic: localStorage.getItem('channel'),
                      qos: 2
                  },
                  subscribe:{
                      doSubscribe: false,
                      doUnSubscribe: false
                  },
                  publish:{
                      doPublish: true,
                      topic:'',
                      qos: 2,
                      payload: ''
                  },
                  client:{
                      connected: false,

                  },
                  receiveNews: []
              },


              // client & driver
              identity: localStorage.getItem("identity"),
              channel: localStorage.getItem("channel"),
              longitude: 1,
              latitude: 2,
              rid: 15,


              // client
              client_ride_data: [{
                  uid: localStorage.getItem('user_id'),
                  pickUpLong: localStorage.getItem('pickup_longitude'),
                  pickUpLat: localStorage.getItem('pickup_latitude'),
                  destLat:localStorage.getItem('arrive_latitude'),
                  destLong:localStorage.getItem('arrive_longitude'),
                  pickUpResolvedAddress: localStorage.getItem('pickup_address'),
                  destResolvedAddress: localStorage.getItem('arrive_address'),
                  rideType: "",
                  province: localStorage.getItem('province'),
                  city: localStorage.getItem('city')
              }],
              // driver
              driver_accept_rid: 19,
              subscriptions: [],
              driver_accepting_form: [{
                  driverId: localStorage.getItem('user_id'),
                  latitude: '',
                  longitude: '',
                  licensePlateNumber: localStorage.getItem('driver_license_plate_number'),
                  vehicleInfo: ""
              }],
              topic: '',


              // Gmap Component
              coordinateX: '',
              coordinateY: '',
              form_type: '',

              showTimeOutMessage: false,
              constructor(){
                  // ...
                  this.handleOnReConnect = this.handleOnReConnect.bind(this);
              }
          }
      },
      computed: {
          get_subscriptions() {
              console.log('get subscriptions',`/api/v1/ride/subscriptions?topic=${this.channel}`)
              return `/api/v1/ride/subscriptions?topic=${this.channel}`
          },
          get_rides_url() {
              return `/api/v1/ride/${this.rid}`;
          },
          driver_get_ride_sessions() {
              return `/api/v1/ride/${this.driver_accept_rid}`
          },
          request_ride(){
              return `/api/v1/ride`
          }
      },
      components: {
          Waiting
      },
      methods: {
          initConnectionData(identity){
              if(identity == 'passenger'){
                  this.mqtt_group_client.connection.retryTimes = 0;
                  this.mqtt_group_client.connection.connecting = false;
                  this.mqtt_group_client.connection.subscribeSuccess = false;
                  this.mqtt_group_client.publish.doPublish = false;
                  this.mqtt_group_client.subscribe.doSubscribe = false;
              }
              if(identity == 'driver'){
                  this.mqtt_group_driver.connection.retryTimes = 0;
                  this.mqtt_group_driver.connection.connecting = false;
                  this.mqtt_group_driver.connection.subscribeSuccess = false;
                  this.mqtt_group_driver.publish.doPublish = false;
                  this.mqtt_group_driver.subscribe.doSubscribe = false;
              }
          },
          handleOnReConnect(identity){
              if(identity == 'passenger'){
                  this.mqtt_group_client.connection.retryTimes += 1;
                  if(this.mqtt_group_client.retryTimes > 5){
                      try{
                          this.mqtt_group_client.client.end();
                          this.initConnectionData("passenger");
                          console.log("Connection max reconnect times limit, stop retry");
                      }catch(error){
                          console.log(error);
                      }
                  }
              }
              if(identity == 'driver'){
                  this.mqtt_group_driver.connection.retryTimes += 1;
                      if(this.mqtt_group_driver.retryTimes > 5){
                          try{
                            this.mqtt_group_driver.client.end();
                            this.initConnectionData("driver");
                            console.log("Connection max reconnect times limit, stop retry");
                          }
                          catch(error){
                            console.log(error);
                          }
                      }
              }
          },
          createConnection(identity){
              try{
                  if(identity == 'passenger'){
                      this.mqtt_group_client.connection.connecting = true;
                      const {protocol, host, port, endpoint, ...options} = this.mqtt_group_client.connection;
                      const connectUrl = `${protocol}://${host}:${port}${endpoint}`;
                      this.mqtt_group_client.client = mqtt.connect(connectUrl, options);
                      if(this.mqtt_group_client.client.on) {
                          this.mqtt_group_client.client.on("connect", () => {
                              this.mqtt_group_client.connection.connecting = false;
                              //console.log("Connection succeed!");
                          });
                      }
                  }
                  if(identity == 'driver'){
                      this.mqtt_group_driver.connection.connecting = true;
                      const {protocol, host, port, endpoint, ...options} = this.mqtt_group_driver.connection;
                      const connectUrl = `${protocol}://${host}:${port}${endpoint}`;
                      this.mqtt_group_driver.driver = mqtt.connect(connectUrl, options);
                      if(this.mqtt_group_driver.driver.on) {
                          this.mqtt_group_driver.driver.on("connect", () => {
                              this.mqtt_group_driver.connection.connecting = false;
                          });
                      }
                  }
              }catch(error){
                  this.mqtt_group_driver.connection.connecting = false;
                  console.log("mqtt.connect error", error);
              }
          },
          publish() {
              const {topic, qos, payload} = this.publish
              this.client.publish(topic, payload, {qos}, error => {
                  if (error) {
                    console.log('Publish error', error)
                  }
              });
          },
          driver_listening_on_channel() {
              console.log("this.channel: ", this.channel);
              axios.get(this.get_subscriptions)
                  .then(response => {
                      console.log("get subscriptions response: ", response.data.data.client_id);
                      this.subscriptions = response.data.data.client_id;
                  }).catch(error => {
                  console.log("error", error)
              });
          },
          mqtt_listening_client(payload, rideId){

              /* prepare for connection */
              this.initConnectionData("passenger");
              this.mqtt_group_client.subscribe.doSubscribe = true;
              this.mqtt_group_client.topic = this.channel;

              /* start connection - this.mqtt_group.client.on() */
              this.createConnection(this.identity);

              if(this.mqtt_group_client.connection.connecting) {
                  this.mqtt_group_client.subscribe.doSubscribe = true;

                  /* subscribing */
                  if (this.mqtt_group_client.subscribe.doSubscribe) {
                      const {topic, qos} = this.mqtt_group_client.subscription;
                      this.mqtt_group_client.client.subscribe(topic, {qos}, (error, res) => {
                          if (error) {
                              console.log('Subscribe to topics error', error)
                            this.mqtt_group_client.subscribeSuccess = false;
                              return
                          }else{
                              this.mqtt_group_client.subscribeSuccess = true;
                              console.log('Subscribe to topics res', res);

                              /* publishing only for client */
                              if (this.mqtt_group_client.subscribeSuccess) {

                                  this.mqtt_group_client.publish.doPublish = true;
                                  this.mqtt_group_client.publish.topic = this.mqtt_group_client.topic;
                                  /* publish hashmap */
                                  const clientMap = new Map();
                                  clientMap.set("rid", rideId);
                                  const json = JSON.stringify(Object.fromEntries(clientMap));
                                  this.mqtt_group_client.publish.payload = json;
                                  const {topic, qos, payload} = this.mqtt_group_client.publish
                                  console.log(`${topic}, ${qos}, ${payload}`);

                                  this.mqtt_group_client.client.publish(topic, payload, {qos}, error => {
                                      if (error) {
                                        console.log('Publish error', error)
                                      } else {
                                        console.log('Publish payload: ', payload);
                                      }
                                  })
                                  /* receiving message */
                                  console.log("passenger receiving message");
                                  this.mqtt_group_client.client.on("message", (topic, message) => {
                                      try{
                                          console.log("message: ",message);
                                          const decoder = new TextDecoder('utf-8');
                                          const text = decoder.decode(message);
                                          console.log("text: ",text);

                                          let map_again = new Map(Object.entries(JSON.parse(text)));
                                          console.log("map_again: ",map_again);
                                          for (let [key, value] of map_again) {
                                              console.log(`key: ${key}`)
                                              console.log(`value: ${value}`)
                                              console.log(`${key}: ${value}`);
                                          }
                                          console.log("Keys in map_again:", Array.from(map_again.keys()));
                                          const mapArray = Array.from(map_again);
                                          const mapObject = Object.fromEntries(mapArray);
                                          if(map_again.has("latitude")){
                                              this.$refs.waitingModal.closeWaitingModal();
                                              console.log("open waiting modal: ",JSON.stringify(mapObject));
                                              this.$refs.waitingModal.openWaitingModal(
                                                  mapObject);
                                          }
                                          /* TODO: once arrived open payment page */


                                      }
                                      catch(error){
                                        console.log("error in passenger receiving message", error);

                                      }
                                  })

                              }
                            /* LISTENING TO ACCEPTED RIDES */
                          if (rideId != null)
                              setTimeout(() => {
                                  console.log('Timeout triggered after specific line execution');
                                  console.log("start listen");
                                  this.intervalId =  setInterval(() => this.listenToEndpoint(rideId), 20000);
                              }, 50000);

                          }
                      });
                      /* unsubscribing */
                      if (this.mqtt_group_client.subscribe.doUnSubscribe) {
                          const {topic} = this.mqtt_group_client.subscription
                          this.mqtt_group_client.client.unsubscribe(topic, error => {
                              if (error) {
                                console.log('Unsubscribe error', error)
                              }
                          });
                      }
                      /* unsubscribing */

                  }
                  /* subscribing */
              }
              /* connecting */

              /* error occurred */
              this.mqtt_group_client.client.on("error", (error) => {
                  console.log("connection error: ", error);
              });

              this.mqtt_group_client.client.on("reconnect", ()=>{
                  this.mqtt_group_client.connection.retryTimes += 1;
                  if(this.mqtt_group_client.retryTimes > 5){
                      try{
                          this.mqtt_group_client.client.end();
                          this.initConnectionData("passenger");
                          console.log("Connection max reconnect times limit, stop retry");
                      }catch(error){
                          console.log(error);
                      }
                  }
              });
          },
          mqtt_listening_driver(payload){

              this.initConnectionData("driver");
              this.mqtt_group_driver.subscribe.doSubscribe = true;
              this.mqtt_group_driver.topic = this.channel;

              /* start connection - this.mqtt_group.client.on() */
              this.createConnection(this.identity);

              if(this.mqtt_group_driver.connection.connecting) {
                  this.mqtt_group_driver.subscribe.doSubscribe = true;

                  /* subscribing */
                  if (this.mqtt_group_driver.subscribe.doSubscribe) {
                      const {topic, qos} = this.mqtt_group_driver.subscription;
                      this.mqtt_group_driver.driver.subscribe(topic, {qos}, (error, res) => {
                          if (error) {
                            console.log('Subscribe to topics error', error)
                            this.mqtt_group_driver.subscribeSuccess= false;
                            return
                          }else {
                              this.mqtt_group_driver.subscribeSuccess = true;
                              console.log('Subscribe to topics res', res);
                              /* publishing */
                              if (this.mqtt_group_driver.subscribeSuccess) {

                                  this.mqtt_group_driver.publish.doPublish = true;
                                  this.mqtt_group_driver.publish.topic = this.mqtt_group_driver.topic;
                                  this.mqtt_group_driver.publish.payload = payload;

                                  this.mqtt_accept_msg = new Map();
                                  this.mqtt_accept_msg.set("accepted", false);

                                  /* receiving message */
                                  console.log("receiving message")
                                  this.mqtt_group_driver.driver.on("message", (topic, message) => {
                                      try {
                                          console.log("message: ", message);
                                          const decoder = new TextDecoder('utf-8');
                                          const text = decoder.decode(message);
                                          console.log("text: ", text);

                                          let driver_accept_timeout;
                                          let driver_accept_interval;

                                          /* not accepted message */
                                          if (text != "{accepted=true}") {
                                              let map_again = new Map(Object.entries(JSON.parse(text)));
                                              console.log("map again: ", map_again)
                                              for (let [key, value] of map_again) {
                                                  console.log(`key: ${key}`)
                                                  console.log(`value: ${value}`)
                                                  console.log(`${key}: ${value}`);

                                              }
                                              if (map_again.has("rid")) {
                                                  console.log("map.get(rid): ", map_again.get("rid"));

                                                  this.driver_accept_rid = map_again.get("rid");
                                                  console.log("driver accept ride url: ", this.driver_get_ride_sessions);


                                                  /* driver accept ride */
                                                  driver_accept_timeout = setTimeout(() => {
                                                      console.log("driver_accept_timeout");
                                                  }, 800000);

                                                  driver_accept_interval = setInterval(() => {
                                                      axios.put(this.driver_get_ride_sessions,
                                                          this.driver_accepting_form[0]
                                                      ).then(response => {
                                                          console.log("driver accept ride: response", response.data);
                                                          if (response.data.msg == "success") {
                                                              console.log("inside driver: ", "success");

                                                              this.mqtt_group_driver.publish.doPublish = true;
                                                              this.mqtt_group_driver.publish.topic = this.mqtt_group_driver.topic;

                                                              /* publish new address */
                                                              console.log("publish new address");
                                                              this.publishDriverLocation();

                                                              clearInterval(driver_accept_interval);
                                                          }
                                                      }).catch(error => {
                                                          console.log("driver accept ride: error", error);
                                                      });
                                                  }, 80000)
                                              }
                                          } /* not accepted message */
                                          else {
                                              clearInterval(driver_accept_interval);
                                              let mqtt_accept_msg = new Map();
                                              mqtt_accept_msg.set("accepted", true);
                                              console.log("mqtt_accept_msg: ", mqtt_accept_msg);
                                              clearTimeout(driver_accept_timeout);
                                          }
                                        /* accepted message */
                                      } catch (error) {
                                          console.log('error receiving message from driver', error);
                                          return Number.POSITIVE_INFINITY;
                                      }


                                  });
                                  /* receiving message */
                              }
                          }
                          /* connecting */

                        });
                        if (this.mqtt_group_driver.subscribe.doUnSubscribe) {
                            const {topic} = this.mqtt_group_driver.subscription
                            this.mqtt_group_driver.driver.unsubscribe(topic, error => {
                                if (error) {
                                  console.log('Unsubscribe error', error)

                                }
                            });
                        }
                  }
              }

            this.mqtt_group_driver.driver.on("error", (error) => {
              console.log("connection error: ", error);
            });

            this.mqtt_group_driver.driver.on("reconnect", ()=>{
              this.mqtt_group_driver.connection.retryTimes += 1;
              if(this.mqtt_group_driver.retryTimes > 5){
                try{
                  this.mqtt_group_driver.driver.end();
                  this.initConnectionData("driver");
                  console.log("Connection max reconnect times limit, stop retry");
                }catch(error){
                  console.log(error);
                }
              }
            });

          },
          publishDriverLocation(){
              let address_playlist = ["9", "13", "11", "12", "14"];
              let currentIndex = 0;

              const publishDriverLocation = () => {
                  if (currentIndex < address_playlist.length) {
                      let driver_location = driver_addr.find(address => address.id === address_playlist[currentIndex]);
                      console.log("Driver's address: ", JSON.stringify(driver_location))
                      this.mqtt_group_driver.publish.payload = JSON.stringify(driver_location);
                      this.mqtt_group_driver.publish.doPublish = true;
                      this.mqtt_group_driver.publish.topic = this.mqtt_group_driver.topic;
                      const {topic, qos, payload} = this.mqtt_group_driver.publish;

                      // console.log("Driver's latitude: ", driver_location.latitude);
                      // console.log("Driver's longitude: ", driver_location.longitude);
                      // localStorage.setItem("driver_location", JSON.stringify(driver_location));
                      this.mqtt_group_driver.driver.publish(topic, payload, {qos}, error=>{
                          if(error){
                              console.log("publish location error", error);
                          }
                          else{
                              console.log("publish location payload", payload);

                              /* TODO: update ride status */

                          }
                      })
                      currentIndex++;
                  }
                  else {
                      clearInterval(driverLocationInterval);
                  }
                  console.log("currentIndex: ", currentIndex);
                  if(currentIndex == address_playlist.length){
                      router.push('/payment')
                  }
              };
            const driverLocationInterval = setInterval(publishDriverLocation, 10000);
          },
          render_driver_location(){
              console.log('driver data:', localStorage.getItem('user_data'));
              var driver_addr_id = Math.floor(Math.random()* driver_addr.length);

              // use philadelphia test
              /*
                  latitude: 36.9945014
                  longitude: -85.5702452
                  address: Society Hill Historic District
               */
              driver_addr_id = 3;
              console.log('driver_addr_id: ', driver_addr_id);
              var driver_info = driver_addr[driver_addr_id];
              console.log('driver json: ', driver_info);
              this.driver_accepting_form[0].latitude = driver_info.latitude;
              this.driver_accepting_form[0].longitude = driver_info.longitude;
          },
          driver_accept_ride() {
              console.log('driver_id', this.driver_accepting_form[0].driverId);
              this.mqtt_group_driver.driver.connected = false;
              this.mqtt_listening_driver(`${this.driver_accepting_form[0].driverId} listening`);
              let rideId = this.driver_accept_rid;
              console.log("rideId: ", this.driver_accept_rid);
              this.$router.push({
                  name: "Gmap",
                  params:{
                      rideId
                  }
              })
          },
          clientRequestRide(){
              console.log("client ride data")
              console.log(this.client_ride_data[0])
              let rideId;
              axios.post(this.request_ride,
                  this.client_ride_data[0]
              ).then(response =>{
                  console.log("RESPONSE: ", response.data.data)
                  this.mqtt_group_client.client.connected = false;
                  rideId = response.data.data.rideId;
                  console.log("rideId: ---> ", rideId);
                  console.log("typeofRidId ----> ", typeof(rideId));
                  this.mqtt_listening_client(JSON.stringify(response.data.data), rideId);
              }).catch(error =>{
                    console.log("client request ride failed: ", error)
              })
          },
          async listenToEndpoint (rideId){
              try {
                  console.log("RIDE ID: ", rideId);
                  axios.get(`/api/v1/ride/ridestatus`, {
                      params:{
                        rId: rideId
                      }
                  }).then(response => {
                      console.log("listen to poll: ", response);
                      const data = response.data;

                      // Process the data from the response
                      console.log(data);
                      if(data.msg== "true"){
                        console.log("accepted!");
                        this.openWaitingModal();
                      }else{
                        console.log(data.msg);
                      }
                  }).catch(error => {
                      console.log("error", error)
                  });
              }
              catch (error) {
                  console.error('Error:', error);
              }
          },
          get_ride_status(rideId){
              axios.get("/api/v1/ride/status", {
                  params:{
                      rId: rideId
                  }
              }).then(response => {
                  console.log("response from get status: ", response.data.data.ride_status);
                  return response.data.data.ride_status;
              }).catch(error =>{
                  console.log("response error from get status: ",error);
              })
          },
          getPosition() {
              const position = document.getElementById("position").innerHTML;
              console.log("position of html is ", position);
          },
          haversine_distance(driver_lat, driver_long, passenger_lat, passenger_long) {
              var R = 3958.8; // Radius of the Earth in miles
              var rlat1 = driver_lat * (Math.PI/180); // Convert degrees to radians
              var rlat2 = passenger_lat * (Math.PI/180); // Convert degrees to radians
              var difflat = rlat2-rlat1; // Radian difference (latitudes)
              var difflon = (passenger_long-driver_long) * (Math.PI/180); // Radian difference (longitudes)

              var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
              return d;
          },
          openWaitingModal(){
              this.$refs.waitingModal.openWaitingModal();
          }
      },
      mounted() {
          console.log("topic: ",localStorage.getItem("channel"));
          console.log("identity: ", this.identity)
          this.get_ride_status(511);
          if(this.identity == 'driver'){
            this.render_driver_location();

          }
          this.client_ride_data.pickUpResolvedAddress = localStorage.getItem('pickup_address');
          this.client_ride_data.formattedAddress_arrive = localStorage.getItem('arrive_address');
      },
      beforeUnmount() {
          clearInterval(this.intervalId);
      }
}
</script>

<template>

  <body>

      <div class="container" v-if="this.identity=='passenger'">
        <div class="client-form-container" v-if="this.identity=='passenger'">
          <form @submit.prevent="clientRequestRide">
            <div class="form-group">
              <label for="uid" class="form-label">uid</label>
              <input v-model="this.client_ride_data[0].uid" type="text" id="uid" class="form-input">
            </div>
            <div class="form-group">
              <label for="pickupLong" class="form-label">pickup-longitude</label>
              <input v-model="this.client_ride_data[0].pickUpLong" type="text" id="pickupLong" class="form-input">
            </div>
            <div class="form-group">
              <label for="pickupLat" class="form-label">pickup-latitude</label>
              <input v-model="this.client_ride_data[0].pickUpLat" type="text" id="pickupLat" class="form-input">
            </div>
            <div class="form-group">
              <label for="pickupResolvedAddr" class="form-label">pickup-resolved-address</label>
              <input v-model="this.client_ride_data[0].pickUpResolvedAddress" type="text" id="pickupResolvedAddr" class="form-input">
            </div>
            <div class="form-group">
              <label for="destinationResolvedAddr" class="form-label">destination-resolved-address</label>
              <input v-model="this.client_ride_data[0].destResolvedAddress" type="text" id="destinationResolvedAddr" class="form-input">
            </div>
            <div class="form-group">
              <label for="rideType" class="form-label">rideType</label>
              <input v-model="this.client_ride_data[0].rideType" type="text" id="rideType" class="form-input">
            </div>
            <div class="form-group">
              <label for="province" class="form-label">province</label>
              <input v-model="this.client_ride_data[0].province" type="text" id="province" class="form-input">
            </div>
            <div class="form-group">
              <label for="city" class="form-label">city</label>
              <input v-model="this.client_ride_data[0].city" type="text" id="state" class="form-input">
            </div>
            <div class="form-group">
              <button type="submit" class="form-btn" v-on:click="clientRequestRide">Submit</button> <!-- Add a submit button -->
            </div>
          </form>
        </div>
<!--        <div class="table-container" v-if="this.identity=='passenger'">-->
<!--          <table  class="custom-table">-->
<!--            <tr v-for="(value, key) in this.client_ride_data[0]" :key="key">-->
<!--              <td>{{ key }}</td>-->
<!--              <td>{{ value }}</td>-->
<!--            </tr>-->
<!--          </table>-->
<!--        </div>-->
        <div class="button-container">
          <button @click="this.openWaitingModal">OpenWaitingPage</button>
          <button v-on:click="this.openWaitingModal">OpenWaitingPage</button>
        </div>

        <Waiting ref="waitingModal" class="waiting-container">
          <p>This is the popup content</p>
        </Waiting>


      </div>



    <div class="container" v-if="this.identity=='driver'">
      <!-- driver receive form -->
      <div class="driver-form-container" v-if="this.identity=='driver'">
        <form @submit.prevent="this.driver_accept_ride">
          <div class="form-group">
            <label for="driverId" class="form-label">driverId</label>
            <input v-model="this.driver_accepting_form[0].driverId" type="text" id="driverId" class="form-input">
          </div>

          <div class="form-group">
            <label for="latitude" class="form-label">latitude</label>
            <input v-model="this.driver_accepting_form[0].latitude" type="text" id="latitude" class="form-input">
          </div>
          <div class="form-group">
            <label for="longitude" class="form-label">longitude</label>
            <input v-model="this.driver_accepting_form[0].longitude" type="text" id="longitude" class="form-input">
          </div>
          <div class="form-group">
            <label for="license_plate_number" class="form-label">license-plate-number</label>
            <input v-model="this.driver_accepting_form[0].licensePlateNumber" type="text" id="license_plate_number" class="form-input">
          </div>
          <div class="form-group">
            <label for="vehicle_info" class="form-label">vehicle-info</label>
            <input v-model="this.driver_accepting_form[0].vehicleInfo" type="text" id="vehicle_info" class="form-input">
          </div>
          <div class="form-group">
            <button type="submit" class="form-btn" v-on:click="this.driver_accept_ride">Submit</button> <!-- Add a submit button -->
          </div>
        </form>
      </div>
      <div class="table-container" v-if="this.identity=='driver'">
        <table  class="custom-table">
          <tr v-for="(value, key) in this.driver_accepting_form[0]" :key="key">
            <td>{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </table>
      </div>
      <div class="small-table-container" v-if="this.identity=='driver'">
        <table  class="custom-table">
          <tr v-for="(subscriptions, index) in this.subscriptions" :key="index">
            <td>{{ index }}</td>
            <td>{{ subscriptions.value }}</td>
          </tr>
        </table>
        <button v-on:click="this.driver_listening_on_channel" class="form-btn">GET SUBSCRIPTIONS</button>
      </div>
    </div>
  </body>
</template>

<style scoped>

.map_ride_container{
  position: relative;
}

.gmap-container{
    height: 900px;
    width: 100%;
    align-content: center;
}

.container{
  align-content: center;
  justify-content: center;
  position: absolute;
  display: flex;
  min-width: 1400px;
  margin-top: 30px;
}
.client-form-container,.driver-form-container{
  display: flex;
  /* max-width: 800px; */
  max-width: 50%;
  max-height: 2000px;
  margin: 20px 10px 0;
  padding: 10px;
  border: 1px solid #ccc;

}
.button-container{
  justify-content: center;
  align-items: center;
  margin: 30px 300px;

}
.waiting-container{
  max-width: 50%;
  display: flex;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-x: auto; /* Enable horizontal scrolling if needed */
  margin: 10px auto 0;
}
.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.form-label {
  flex: 1;
  margin-right: 10px;
  width: 200px;
}

.form-input {
  flex: 2;
  width: 30%;
}

.form-btn {
  font-size: 16px;
  border-radius: 5px;
  padding: 14px 25px;
  border: none;
  font-weight: 500;
  background-color: #6a64f1;
  color: white;
  cursor: pointer;
  margin-top: 25px;
}

.table-container {
  /*max-width: 800px; */
  max-width: 30%;
  display: flex;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-x: auto; /* Enable horizontal scrolling if needed */
  margin: 10px auto 0;

}
.small-table-container{
  max-width: 20%;
  min-width: 300px;
  //max-width: 500px;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-x: auto; /* Enable horizontal scrolling if needed */
  margin: 10px auto 0;
}
.custom-table {
  width: 100%;
  border-collapse: collapse;
}
.custom-table th{
  background-color: #f2f2f2;
}
.custom-table th, .custom-table td {

  padding: 8px;
  text-align: left;
  width: 120px;
}

.custom-table td:first-child {
  font-weight: bold;
  width: 60px;
}

.custom-table td:last-child {
  font-style: italic;
}

.table-container {
  /*max-width: 800px; */
  max-width: 20%;
  display: flex;
  border: 1px solid #ccc;
  padding: 10px;
  overflow-x: auto; /* Enable horizontal scrolling if needed */
  margin: 10px auto 0;

}


</style>