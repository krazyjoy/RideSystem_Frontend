

<script>
import axios from 'axios'
import GMap from './Gmap.vue'
import {v4} from 'uuid';
import driver_addr from '/src/driver_addr.json'

import * as mqtt from 'mqtt/dist/mqtt.min';

  export default {
    name: "rides-view",
    data() {
      return {
        // mqtt https://www.emqx.com/en/blog/how-to-use-mqtt-in-vue
        mqtt_group:{
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
          destResolvedAddress: localStorage.getItem('arrival_address'),
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
      GMap
    },
    methods: {
      initConnectionData(){
        this.mqtt_group.client = {
          connected: false,


        };
        this.mqtt_group.connection.retryTimes = 0;
        this.mqtt_group.connection.connecting = false;
        this.mqtt_group.connection.subscribeSuccess = false;
        this.mqtt_group.publish.doPublish = false;
        this.mqtt_group.subscribe.doSubscribe = false;
      },
      handleOnReConnect(){
        this.mqtt_group.connection.retryTimes += 1;
        if(this.mqtt_group.retryTimes > 5){
          try{
            this.mqtt_group.client.end();
            this.initConnectionData();
            console.log("Connection max reconnect times limit, stop retry");
          }catch(error){
            console.log(error);
          }
        }
      },
      createConnection(){

        try{
          this.mqtt_group.connection.connecting = true;
          const {protocol, host, port, endpoint, ...options} = this.mqtt_group.connection;
          const connectUrl = `${protocol}://${host}:${port}${endpoint}`;
          this.mqtt_group.client = mqtt.connect(connectUrl, options);
          if(this.mqtt_group.client.on){
            this.mqtt_group.client.on("connect", ()=>{
              this.mqtt_group.connection.connecting = false;
              //console.log("Connection succeed!");
            });
          }

        }catch(error){
          this.mqtt_group.connection.connecting = false;
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
      mqtt_listening(payload){
        /* prepare for connection */

        let send_payload = payload;
        this.initConnectionData();
        this.mqtt_group.subscribe.doSubscribe = true;
        this.mqtt_group.topic = this.channel;

        /* start connection - this.mqtt_group.client.on() */
        this.createConnection();

        if(this.mqtt_group.connection.connecting) {
          this.mqtt_group.subscribe.doSubscribe = true;

          /* subscribing */
          if (this.mqtt_group.subscribe.doSubscribe) {
            const {topic, qos} = this.mqtt_group.subscription;
            this.mqtt_group.client.subscribe(topic, {qos}, (error, res) => {
              if (error) {
                console.log('Subscribe to topics error', error)
                return
              }
              this.mqtt_group.subscribeSuccess = true;
              console.log('Subscribe to topics res', res);

              /* publishing only for client */
              if (this.mqtt_group.subscribeSuccess) {

                this.mqtt_group.publish.doPublish = true;
                this.mqtt_group.publish.topic = this.mqtt_group.topic;
                this.mqtt_group.publish.payload = send_payload;
                const { topic, qos, payload } = this.mqtt_group.publish

                if(this.identity == 'passenger'){
                  this.mqtt_group.client.publish(topic, payload, { qos }, error => {
                    if (error) {
                      console.log('Publish error', error)
                    }else{
                      console.log('Publish payload: ', send_payload);
                    }
                  })
                }

                /* receiving message */
                console.log("receiving message")
                this.mqtt_group.client.on("message", (topic, message) => {
                  const decoder = new TextDecoder('utf-8');
                  const text = decoder.decode(message);
                  try{
                    let parsed_text = JSON.parse(text)


                    if(this.mqtt_group.receiveNews != ''){

                      this.mqtt_group.receiveNews.push(parsed_text);
                    }else{
                      this.mqtt_group.receiveNews = [parsed_text];
                    }

                    /* distance calculation */
                    let min_dis = Number.POSITIVE_INFINITY;
                    let closest_order = -1;
                    if(this.identity == 'driver'){
                      console.log("message from mqtt group: ", this.mqtt_group.receiveNews)
                      for (let index=0; index < this.mqtt_group.receiveNews.length; index++) {


                        let pickUpLat = this.mqtt_group.receiveNews[index]["departureLatitude"];
                        let pickUpLong = this.mqtt_group.receiveNews[index]["departureLongitude"];

                        console.log('pickUpLat', pickUpLat)
                        console.log('pickUpLong',pickUpLong)
                        console.log('driver_latitude',this.driver_accepting_form[0].latitude)
                        console.log('driver_longitude',this.driver_accepting_form[0].longitude)
                        // driver listens to MQTT then
                        let dis = this.haversine_distance(this.driver_accepting_form[0].latitude, this.driver_accepting_form[0].longitude,
                            pickUpLat, pickUpLong);
                        if(dis < min_dis){
                          min_dis = Math.min(dis, min_dis);
                          closest_order = this.mqtt_group.receiveNews[index]["rideId"];

                          /* driver accepting */
                          if(closest_order != Number.POSITIVE_INFINITY){
                            this.driver_accept_rid = closest_order;

                            axios.put(this.driver_get_ride_sessions,
                                this.driver_accepting_form[0]
                            ).then(response => {

                              console.log("driver-accepting-form", this.driver_accepting_form[0]);

                              console.log('driver accept created session');
                              console.log("data: ", response.data);
                              console.log("status: ", response.data.status);

                              // this.driver_accepted(channel);
                            }).catch(error =>{
                              console.log('failed to accept ride', error);
                            })
                          }
                        }
                      }
                    }

                    console.log('mis dis: ', min_dis);
                    console.log('closest order', closest_order);
                   return closest_order


                    // localStorage.setItem("pickUpLong", ride_info["departureLongitude"])
                    // localStorage.setItem("pickUpLat", ride_info["departureLatitude"])
                  }catch(error){
                    console.log('parse error', error)
                  }

                });

              }
            });
            if (this.mqtt_group.subscribe.doUnSubscribe) {
              const {topic} = this.mqtt_group.subscription
              this.mqtt_group.client.unsubscribe(topic, error => {
                if (error) {
                  console.log('Unsubscribe error', error)
                }
              });
            }
          }
        }

        this.mqtt_group.client.on("error", (error) => {
          console.log("connection error: ", error);
        });

        this.mqtt_group.client.on("reconnect", ()=>{
          this.mqtt_group.connection.retryTimes += 1;
          if(this.mqtt_group.retryTimes > 5){
            try{
              this.mqtt_group.client.end();
              this.initConnectionData();
              console.log("Connection max reconnect times limit, stop retry");
            }catch(error){
              console.log(error);
            }
          }
        });
        return Number.POSITIVE_INFINITY;

      },
      render_driver_location(){
        console.log('driver data:', localStorage.getItem('user_data'));

        var driver_addr_id = Math.floor(Math.random()* driver_addr.length);
        console.log('driver_addr_id: ', driver_addr_id);
        var driver_info = driver_addr[driver_addr_id];
        console.log('driver json: ', driver_info);
        this.driver_accepting_form[0].latitude = driver_info.latitude;
        this.driver_accepting_form[0].longitude = driver_info.longitude;

      },
      driver_accept_ride() {
        console.log("this.driver_accepting_form ", this.driver_accepting_form[0].latitude)
        console.log(this.driver_accepting_form[0].longitude)
        // this.render_driver_location();
        console.log('driver_id', this.driver_accepting_form[0].driverId);
        //this.driver_listening_on_channel();


        let closest_order = this.mqtt_listening(`${this.driver_accepting_form[0].driverId} listening`);
        //this.mqtt_group.client.end()
        console.log("closest order", closest_order);
        //this.mqtt_group.client.end()

        //let ride_info = localStorage.getItem("ride_info")





      },
      clientRequestRide(){
        console.log("client ride data")
        console.log(this.client_ride_data[0])
        axios.post(this.request_ride,
            this.client_ride_data[0]
        ).then(response =>{
          console.log("client request ride: ", response.data.data)
          this.mqtt_listening(JSON.stringify(response.data.data));
        }).catch(error =>{
              console.log("client request ride failed: ", error)
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
      }


    },
    mounted() {
      console.log("identity: ", this.identity)

      if(this.identity == 'driver'){
        this.render_driver_location();

      }
    }
  }
</script>

<template>

  <body>
  <div class="map_ride_container">

    <GMap/>
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
      <div class="table-container" v-if="this.identity=='passenger'">
        <table  class="custom-table">
          <tr v-for="(value, key) in this.client_ride_data[0]" :key="key">
            <td>{{ key }}</td>
            <td>{{ value }}</td>
          </tr>
        </table>
      </div>
    </div>
    <div class="container" v-if="this.identity=='driver'">
      <!-- driver receive form -->
      <div class="driver-form-container" v-if="this.identity=='driver'">
        <form @submit.prevent="clientRequestRide">
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

  </div>




  </body>
</template>

<style scoped>
.map_ride_container{
  display: flex;
}
.container{
  display: flex;
  min-width: 1400px;
  margin-top: 30px;
}
.client-form-container,.driver-form-container{
  display: flex;
  /* max-width: 800px; */
  max-width: 40%;
  max-height: 2000px;
  margin: 20px auto 0;
  padding: 10px;
  border: 1px solid #ccc;

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



</style>