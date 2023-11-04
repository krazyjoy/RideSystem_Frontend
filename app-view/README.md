# Helsinki-City-Bike

### Vue3
### node - v16.16
### npm - 8.11.0

## Project setup

### Configuration changes

In vue.config.js you should change the proxy server settings. 
Change the host of the backend API.
```
    target: 'http://localhost:8089/'
```
### Install packages
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration - Official document
See [Configuration Reference](https://cli.vuejs.org/config/).

### Project Structure

> app-view
    > src
        main.js
        route.js
        axios.js
        
        address_db.json 
        driver_addr.json
        
        > components
            Home.vue
            login.vue
            users.vue
            rides.vue
            Gmap.vue

### vue.config.js
**must locate at the root folder of `app-view`**

```
module.exports = {
    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:8089/',
                changeOrigin: true,
                pathRewrite: {
                '^/api': '/api'
                }
            }
        }
    }
}
```

### main.js

register
1. router from route.js
2. VueAxios
3. VueSweetAlert

mount #app

### route.js

route: `/` 
component: `Home.vue`

route: `/login`
component: `login.vue`

route: `/users`
component: `users.vue`

route: `/rides`
component: `rides.vue`

```
    const router = createRouter({
    history: createWebHistory(),
    routes, //same --- > routes:routes
    })
    export default router

```
### axios.js
- create axios instance 
  - baseURL: 'http://localhost:8089/api/v1/'
- install to axios
  ```
    export default {
       install: function(Vue) {
           Object.defineProperty(Vue.prototype, 'axios', { value: instance });
       }
    }
  ```
### address_db.json
purpose: autogenerate 
- client pickup longitude, 
- pickup latitude, 
- destination longitude, 
- destination latitude,

### driver_addr.json
- driver latitude
- driver longitude



### login component

- View: sign in form
  input: username, password, contact number
  button: `sign in` -> login method
- Methods:
  - login(): 
    1. `axios.post("/api/v1/user/login", userData)`, where userData comes from the input form
    2. calls on `this.getUserByName(userData.userName)`
  - getUserByName(username): `axios.get(this.get_specific_user_by_name_url, { params: { "username": username } })`
    - response: uid, userName, password, role("user/admin"), vehicleType("default:null"), identity("driver/passenger"), city, contactNumber, licensePlateNumber("default:null"), mileage, state
    - pass forward user fields from the database to rides section: 
  
### rides component
identity: driver
- render driver location (`driver_addr.json`)
- listen to mqtt: `${driver_id}` listening
    - `initConnectionData()`: reset all connection flags (isConnected, doSubscribe, doPublish,...)
    - `createConnection()`: 
      ```
         this.mqtt_group.client = mqtt.connect(connectUrl, options);
         if(this.mqtt_group.client.on){
             this.mqtt_group.client.on("connect", ()=>{
             this.mqtt_group.connection.connecting = false;
             //console.log("Connection succeed!");
             });
         }
      ```
    -  subscribe:
        ```
            this.mqtt_group.client.subscribe(topic, {qos}, (error, res) => {
                // do subscribing
            } 
        ```
    -  receive:
          ```
              this.mqtt_group.client.on("message", (topic, message) => {
                1. convert message of bytes data type to json
                2. push message to mqtt_group.receiveNews list 
                3. calculate min dis among the receiveNews list
                4. accept the ride id with min dis
                    axios.put(this.driver_get_ride_sessions,
                                this.driver_accepting_form[0]
                            ).then(response => {
                    });
              }
          ```
identity: passenger
- sends out ride request `/api/v1/ride` with request body of `client_ride_data`: 
  ```
    axios.post(this.request_ride,
       this.client_ride_data[0]
    )
  ```

- listen to mqtt:  `JSON.stringify(response.data.data)`, where response.data.data is from `/api/v1/ride`
    - `initConnectionData()`: reset all connection flags (isConnected, doSubscribe, doPublish,...)
    - `createConnection()`:
      ```
         this.mqtt_group.client = mqtt.connect(connectUrl, options);
         if(this.mqtt_group.client.on){
             this.mqtt_group.client.on("connect", ()=>{
             this.mqtt_group.connection.connecting = false;
             //console.log("Connection succeed!");
             });
         }
      ```
    -  subscribe:
        ```
            this.mqtt_group.client.subscribe(topic, {qos}, (error, res) => {
                // do subscribing
            } 
        ```
    -  publish:
       ```
              this.mqtt_group.client.publish(topic, payload, { qos }, error => {
                // payload is ride response requested in `/api/v1/ride`
              }
       ```
    -  receive:
          ```
              this.mqtt_group.client.on("message", (topic, message) => {
                1. convert message of bytes data type to json
                2. push message to mqtt_group.receiveNews list 
                3. calculate min dis among the receiveNews list
                4. accept the ride id with min dis
                    axios.put(this.driver_get_ride_sessions,
                                this.driver_accepting_form[0]
                            ).then(response => {
                    });
              }
          ```
  
    