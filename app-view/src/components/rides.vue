

<script>
import axios from 'axios'
// import GMap from './Gmap.vue'
import {v4} from 'uuid';
import driver_addr from '/src/driver_addr.json'
import * as mqtt from 'mqtt/dist/mqtt.min';
// import Waiting from './waiting.vue';
import router from '../route'
import {ref} from "vue";
export default {
      name: "rides-view",
      setup(){
          // const mapCenter = ref({lat: 51.5072, lng:0.1276});
          const mapCenter = ref({lat: 1, lng:2});
          const pickup_lat = parseFloat(localStorage.getItem('pickup_latitude'));
          const pickup_lng = parseFloat(localStorage.getItem('pickup_longitude'));
          const setupMap = () => {
              console.log("mapCenter: ", mapCenter.value)
              mapCenter.value.lat = pickup_lat;
              mapCenter.value.lng = pickup_lng;

          };

          return {
              mapCenter,
              pickup_lat,
              pickup_lng,
              setupMap,
          }

      },
      data() {
          return {

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

              logs:[],
              mqtt_driver_location:[],
              driver_location_markers: [],

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

          request_ride(){
              return `/api/v1/ride`
          }
      },
      components: {
          // Waiting
      },
      methods: {
          /* START OF METHODS */
          initConnectionData(identity){
              if(identity == 'passenger'){
                  this.mqtt_group_client.connection.retryTimes = 0;
                  this.mqtt_group_client.connection.connecting = false;
                  this.mqtt_group_client.connection.subscribeSuccess = false;
                  this.mqtt_group_client.publish.doPublish = false;
                  this.mqtt_group_client.subscribe.doSubscribe = false;
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
          display_log(latitude, longitude){
              // console.log("driver_locations", driver_locations)
              // console.log("driver_locations", JSON.parse(driver_locations))
              // const driver_locations_map = new Map(Object.entries(JSON.parse(driver_locations)))
              // for (let [key, value] of driver_locations_map) {
              //   console.log(`key: ${key}`)
              //   console.log(`value: ${value}`)
              //   console.log(`${key}: ${value}`);
              // }
              latitude = Number((latitude).toFixed(5));
              longitude = Number((longitude).toFixed(5));
              console.log("driverlat: ", latitude);
              console.log("driverlat typeof: ", typeof(latitude));
              console.log("driverLng: ", longitude);
              console.log("driverLng: typeof",typeof(longitude));

              this.mqtt_driver_location.push({"driverLat":longitude, "driverLng":longitude});

              const driverLatLng = { position: { lat: latitude, lng: longitude}};
              // const driverLatLng1 = {
              //   lat: 1.234242,
              //   lng: 2.657574
              // };
              // const driverLatLng2 = {
              //   lat: 2.7855654,
              //   lng: 3.436563
              // };
              // const driverLatLng3 = {
              //   lat: 3.325,
              //   lng: 4.865
              // };
              // this.driver_location_markers.push({
              //     position: driverLatLng1
              // });
              // this.driver_location_markers.push({
              //   position: driverLatLng2
              // });
              // this.driver_location_markers.push({
              //   position: driverLatLng3
              // });
              this.driver_location_markers.push(driverLatLng);
              // this.driver_location_markers = [{position: {lat: 39.9678, lng: -75.2061}}, {position: {lat: 39.8378, lng: -75.1932}}]
              console.log("driver location markers: ", this.driver_location_markers);



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
                                          if(text != "{accepted=true}"){
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
                                              console.log("mapObject", mapObject);




                                              if(map_again.has("driverLat") ){
                                                  // this.$refs.waitingModal.closeWaitingModal();
                                                  try{
                                                      console.log("access key")
                                                      let lat = parseFloat(mapObject["driverLat"]);
                                                      let lng = parseFloat(mapObject["driverLng"]);
                                                      console.log("lat: ", lat);
                                                      console.log("lng: ", lng);
                                                      const get_driver_position_interval = setInterval(this.display_log(lat, lng), 50000);
                                                      setTimeout(() => {

                                                          clearInterval(get_driver_position_interval);
                                                          console.log("get_driver_position ... ");
                                                      }, 800000);

                                                      // this.$refs.waitingModal.openWaitingModal(
                                                      //     mapObject);
                                                  }catch(error){
                                                      console.log("error in pushing driver location", )

                                                  }


                                              }

                                              /* TODO: once arrived open payment page */
                                              try{
                                                  console.log("inside received not driver location");
                                                  console.log("attempting to get ride status");
                                                  this.get_ride_status(rideId);
                                              }catch(error){
                                                  console.log("get ride status ... error", error)
                                              }
                                          }else{
                                            console.log("client received accepted message");
                                          }



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
          clientRequestRide(){
              console.log("client ride data")
              console.log(this.client_ride_data[0])
              let rideId;
              this.mqtt_driver_location = []
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
                  axios.get(`/api/v1/ride/ridestatus/${rideId}`
                  ).then(response => {
                      console.log("listen to poll: ", response);
                      const data = response.data;

                      // Process the data from the response
                      console.log(data);
                      if(data.msg== "true"){
                        console.log("client request ride listening to endpoint accepted!");
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
                  let ride_status = response.data.data.ride_status;
                  let rid = rideId;
                  if(ride_status =="Arrived"){
                      this.$router.push({name:"Payment", params:{rid}});
                  }
                  return response.data.data.ride_status;
              }).catch(error =>{
                  console.log("response error from get status: ",error);
              })
          },
          getPosition() {
              const position = document.getElementById("position").innerHTML;
              console.log("position of html is ", position);
          },

          openWaitingModal(){
              this.$refs.waitingModal.openWaitingModal();
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
          pass_driver_data(){
              console.log("this.driver_accepting_form", this.driver_accepting_form[0])
              localStorage.setItem("driverId", this.driver_accepting_form[0].driverId)
              localStorage.setItem("driverLat", this.driver_accepting_form[0].latitude)
              localStorage.setItem("driverLng", this.driver_accepting_form[0].longitude)
              localStorage.setItem("licensePlateNumber", this.driver_accepting_form[0].licensePlateNumber)
              localStorage.setItem("identity", this.identity)
              router.push("/trajectory")
          },

          /* END OF METHODS */
      },
      mounted() {
          console.log("topic: ",localStorage.getItem("channel"));
          console.log("identity: ", this.identity)
          console.log("driver locations: ", this.mqtt_driver_location);
          let new_locations = '{"driverLat": 21.21, "driverLng": 13.23}'
          let new_locations_map = new Map(Object.entries(JSON.parse(new_locations)));

          const mapArray = Array.from(new_locations_map);
          const mapObject = Object.fromEntries(mapArray);
          this.mqtt_driver_location.push(JSON.stringify(mapObject));
          console.log("updated driver locations", this.mqtt_driver_location);
          if(this.identity=="driver")
              this.render_driver_location();
          this.get_ride_status(511);
          this.client_ride_data.pickUpResolvedAddress = localStorage.getItem('pickup_address');
          this.client_ride_data.formattedAddress_arrive = localStorage.getItem('arrive_address');
          this.setupMap();
          this.driver_location_markers = [];

      },
      beforeUnmount() {
          clearInterval(this.intervalId);
      }
}
</script>

<template>

    <body>

        <div class="app-container" v-if="this.identity=='passenger'">
  <!--        <div class="client-form-container" v-if="this.identity=='passenger'">-->
            <div class="form-block" v-if="this.identity=='passenger'">
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
            <div class="right-side">


                <div class="gmap-block">
<!--                  <GMapMap :center=this.mapCenter-->
<!--                  -->
<!--                  :zoom="13"-->
<!--                  map-type-id="terrain"-->
<!--                  style="width: 100%; height: 400px;"-->
<!--                  >-->
                    <GMapMap
                        :center=this.mapCenter
                        :zoom="13"
                        map-type-id="terrain"
                        style="width: 100%; height: 600px;"
                    >
                      <GmapCluser>
                        <GMapMarker
                            v-for="(marker, index) in this.driver_location_markers"
                            :key="index"
                            :position="marker.position"
                            :clickable="true"
                            :draggable="false">
                        </GMapMarker>
                      </GmapCluser>

                    </GMapMap>
                </div>
                <div class="log-info-block">

<!--                    <Waiting ref="waitingModal" class="waiting-container">-->
<!--                      <p>This is the popup content</p>-->
<!--                    </Waiting>-->
<!--                    <button @click="this.openWaitingModal">OpenWaitingPage</button>-->
                    <div v-for="driver_position in this.mqtt_driver_location" :key="driver_position.id">
                          {{driver_position["driverLat"]}} - {{driver_position["driverLng"]}}
                    </div>
                    <div>
                        <h2 style="padding-left: 120px">Latitude and Longitude Records</h2>
                        <table>
                          <thead>
                          <tr>
                            <th>ID</th>
                            <th>Latitude</th>
                            <th>Longitude</th>
                          </tr>
                          </thead>
                          <tbody>
                          <tr v-for="driver_position in this.mqtt_driver_location" :key="driver_position.id">
                            <td>{{driver_position.id}}</td>
                            <td>{{driver_position["driverLat"]}}</td>
                            <td>{{driver_position["driverLng"]}}</td>
                          </tr>
                          </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
  <!--      <div cla
  ss="button-container">-->




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
              <button type="submit" class="form-btn" v-on:click="this.pass_driver_data">Submit</button> <!-- Add a submit button -->
            </div>
          </form>
        </div>
<!--        <div class="table-container" v-if="this.identity=='driver'">-->
<!--          <table  class="custom-table">-->
<!--            <tr v-for="(value, key) in this.driver_accepting_form[0]" :key="key">-->
<!--              <td>{{ key }}</td>-->
<!--              <td>{{ value }}</td>-->
<!--            </tr>-->
<!--          </table>-->
<!--        </div>-->
<!--        <div class="small-table-container" v-if="this.identity=='driver'">-->
<!--          <table  class="custom-table">-->
<!--            <tr v-for="(subscriptions, index) in this.subscriptions" :key="index">-->
<!--              <td>{{ index }}</td>-->
<!--              <td>{{ subscriptions.value }}</td>-->
<!--            </tr>-->
<!--          </table>-->
<!--          <button v-on:click="this.driver_listening_on_channel" class="form-btn">GET SUBSCRIPTIONS</button>-->
<!--        </div>-->
      </div>
    </body>
</template>

<style scoped>


.app-container{
    display: flex;
    justify-content: space-between;
    width: 2000px;
    height: 1200px;
}
.right-side{
    display: flex;
    flex-direction: column;
    flex: 0 0 70%;
}
.form-block {
    flex: 0 0 30%;
    margin: 0px;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 5px;
    width: 100%;

}

.gmap-block {
    flex: 1; /* Take equal space in the column */
    margin: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.log-info-block{
    flex: 1; /* Take equal space in the column */
    margin: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
}
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
    left: -200px;

    width: 500px;
    margin-top: 30px;
}
.client-form-container,.driver-form-container{
  position: fixed;
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
  width: 400px;
  position: fixed;
  left: 1000px;
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


table {
  border-collapse: collapse;
  width: 100%;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  font-size: 18px;
}

th {
  background-color: #f2f2f2;
}


</style>