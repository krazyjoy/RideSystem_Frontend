<template>
  <div class="home-container">

      <div class="emq-title">
        Configuration
        <label for="identity">identity</label>
        <input v-model="this.identity" type="text" id="identity">
        <button v-on:click="clientRequestRide">Client</button>
        <button v-on:click="driver_accept_ride">Driver</button>
      </div>

      <div class="emq-title">
        Receive
      </div>

  </div>
</template>

<script>
import * as mqtt from 'mqtt/dist/mqtt.min';
import axios from "axios";
import driver_addr from "@/driver_addr.json";
import {v4} from 'uuid';

export default {
  name: 'mqtt-view',
    data() {
      return {
        // mqtt https://www.emqx.com/en/blog/how-to-use-mqtt-in-vue
        mqtt_group_driver: {
          connection: {
            protocol: 'ws',
            host: '192.168.12.218',
            port: '8083',
            endpoint: '/mqtt',
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

          subscription: {
            topic: localStorage.getItem('channel'),
            qos: 2
          },
          subscribe: {
            doSubscribe: false,
            doUnSubscribe: false
          },
          publish: {
            doPublish: true,
            topic: '',
            qos: 2,
            payload: ''
          },
          driver: {
            connected: false,
          },
          receiveNews: []
        },
        constructor() {
          // ...
          this.handleOnReConnect = this.handleOnReConnect.bind(this);
        },
        mqtt_group_client: {
          connection: {
            protocol: 'ws',
            host: '192.168.12.218',
            port: '8083',
            endpoint: '/mqtt',
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

          subscription: {
            topic: localStorage.getItem('channel'),
            qos: 2
          },
          subscribe: {
            doSubscribe: false,
            doUnSubscribe: false
          },
          publish: {
            doPublish: true,
            topic: '',
            qos: 2,
            payload: ''
          },
          client: {
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
          uid: 6,
          pickUpLong: 39.9683,
          pickUpLat: -75.1717,
          destLat: 33.6665,
          destLong: -84.4426,
          pickUpResolvedAddress: "Eastern State Penitentiary",
          destResolvedAddress: "academy theatre",
          rideType: "COMFORT",
          province: "Pennsylvania",
          city: "Philadelphia"
        }],
        // driver
        driver_accept_rid: 19,
        subscriptions: [],
        driver_accepting_form: [{
          driverId: 9,
          latitude: 36.9945014,
          longitude: -85.5702452,
          licensePlateNumber: "0505",
          vehicleInfo: "A"

        }],
        topic: 'Pennsylvania',

        // Gmap Component
        coordinateX: '',
        coordinateY: '',
        form_type: '',

        showTimeOutMessage: false,
        mqtt_accept_msg: new Map(),
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
            }catch(error){
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
              return
            }
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

                }
                catch(error){
                  console.log("error in passenger receiving message", error);

                }
              })

              if (rideId != null)
                setTimeout(() => {
                  console.log('Timeout triggered after specific line execution');
                  console.log("start listen");
                  this.intervalId =  setInterval(() => this.listenToEndpoint(rideId), 20000);
                }, 50000);
            }
          });
          if (this.mqtt_group_client.subscribe.doUnSubscribe) {
            const {topic} = this.mqtt_group_client.subscription
            this.mqtt_group_client.client.unsubscribe(topic, error => {
              if (error) {
                console.log('Unsubscribe error', error)

              }
            });
          }
        }
      }
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
      return Number.POSITIVE_INFINITY;

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
              /* publishing only for client */
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
                              this.publishDriverLocation();
                              // clearInterval(driver_accept_interval);
                            }
                          }).catch(error => {
                            console.log("driver accept ride: error", error);
                          });
                        }, 80000)
                      }
                    } else {
                      clearInterval(driver_accept_interval);
                      let mqtt_accept_msg = new Map();
                      mqtt_accept_msg.set("accepted", true);
                      console.log("mqtt_accept_msg: ", mqtt_accept_msg);
                      clearTimeout(driver_accept_timeout);
                    }

                  } catch (error) {
                    console.log('error receiving message from driver', error);
                    return Number.POSITIVE_INFINITY;
                  }


                });

              }
            }

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


      this.mqtt_group_driver.driver.connected = false;
      this.mqtt_listening_driver(`${this.driver_accepting_form[0].driverId} listening`);


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
        // console.log(typeof (rideId));
        // console.log(`/api/v1/ride/ridestatus/` + rideId)
        axios.get(`/api/v1/ride/ridestatus`, {
          params:{
            rId: rideId
          }

        })
            .then(response => {
              console.log("listen to poll: ", response);
              const data = response.data;

              // Process the data from the response
              console.log(data);
              if(data.msg== "success"){
                console.log("accepted!");
              }else{
                console.log(data.msg);
              }
              // Call the function again after a delay

            })


            .catch(error => {
              console.log("error", error)
            });


      } catch (error) {
        console.error('Error:', error);

        // In case of an error, you may want to handle it (e.g., retry the request or stop listening)
        // For simplicity, we'll just call the function again after a delay here
        //setTimeout(this.listenToEndpoint(rideId), 200000); // Retry after 2 seconds
      }
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
    publishDriverLocation() {
      let address_playlist = ["9", "13", "11", "12", "14"];
      let currentIndex = 0;

      const publishDriverLocation = () => {
        if (currentIndex < address_playlist.length) {
          if (Array.isArray(driver_addr)) {
            console.log('jsonData is an array:', driver_addr);
            console.log("id: ",address_playlist[currentIndex]);
            let driver_location = driver_addr.find(address => address.id === address_playlist[currentIndex]);
            console.log("Driver's address: ", driver_location)
            console.log("driver location: ",typeof(driver_location));
            this.mqtt_group_driver.publish.payload = JSON.stringify(driver_location);

            console.log("Driver's latitude: ", driver_location.latitude);
            console.log("Driver's longitude: ", driver_location.longitude);
            localStorage.setItem("driver_location", JSON.stringify(driver_location));

            currentIndex++;
          } else {
            console.log("typeof(driver_addr): ", typeof (driver_addr));
          }
        } else {
          clearInterval(driverLocationInterval);
        }
      }
      const driverLocationInterval = setInterval(publishDriverLocation, 10000);
    }
  },
  mounted() {
    this.identity = '';
    console.log("topic: ",localStorage.getItem("channel"));
    console.log("identity: ", this.identity);

    //this.mqtt_listening_driver("aaa");

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

<style>


.home-container {
  max-width: 1100px;
  margin: 0 auto;

  .conn-btn {
    color: #fff;
    background-color: #00b173;
    font-size: 14px;
  }

  .publish-btn {
    margin-bottom: 20px;
    float: right;
  }

}
</style>