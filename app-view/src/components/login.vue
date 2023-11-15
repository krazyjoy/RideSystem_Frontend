<template>

  <h2 class="form-title">Sign in/up Form</h2>
  <div class="container" ref="container">
    <div class="form-container sign-in-container" v-if="showSignIn = true">
      <form @submit.prevent="login" action="#">
        <h1>Sign in</h1><br>
        <input v-model="signInContactNumber" type="contact_number" placeholder="ContactNumber"/>
        <input v-model="signInUsername" type="username" placeholder="Username"/>
        <input v-model="signInPassword" type="password" placeholder="Password" />
        <a href="#">Forgot your password?</a><br>
        <button type="submit">Sign In</button>
      </form>
    </div>
    <div class="form-container sign-up-container">
      <form @submit.prevent="signup" action="#" v-if="signUpSuccess = -1">
        <h1>Create Account</h1>
        <input v-model="signUpUsername" type="username" placeholder="Username"/>
        <input v-model="signUpIdentity" type="text" placeholder="Driver/Passenger"/>
        <input v-model="signUpPassword" type="password" placeholder="Password" />
        <input v-model="signUpContactNumber" type="contact_number" placeholder="ContactNumber"/>
        <button type="submit">Sign Up</button>

      </form>
      <h3 v-if="signUpSuccess = 1">Sign Up Succeed!</h3>
      <h3 v-if="signUpSuccess = 0">Sign Up Failed!</h3>
    </div>



  </div>
  <div class="button-container">
    <button class="ghost" id="toggleButton" @click="togglePanel">Toggle</button>
<!--    <button class="ghost" id="signIn" @click="togglePanel">Sign In</button>-->
<!--    <button class="ghost" id="signUp" @click="togglePanel">Sign Up</button>-->
  </div>
</template>

<script>

import axios from 'axios';
import VueJwtDecode from 'vue-jwt-decode'
import router from '../route.js'


export default{
  name: 'login-view',
  data(){

    return{
      showSignIn: true,
      signInUsername:'',
      signInContactNumber: '',
      signInPassword:'',
      signUpUsername: '',
      signUpIdentity: '',
      signUpContactNumber: '',
      signUpPassword: '',
      user_data:[],
      signUpSuccess: -1
    }
  },
  computed:{
    get_specific_user_by_contact_number_url(){
      return `/api/v1/user/getuser/contactNumber`
    }
  },
  methods: {
    togglePanel(){
      this.$refs.container.classList.toggle('right-panel-active');
      this.showSignIn = !this.showSignIn;
    },
    login() {
      const userData = {
        contactNumber: this.signInContactNumber,
        password: this.signInPassword,
        userName: this.signInUsername
      };


      //this.$http.post("/api/v1/user/login", userData)
      axios.post("/api/v1/user/login", userData)
          .then(response => {

            console.log('Login successful', response.data.token);

            console.log('current_token: ', response.data.token);


            const token = response.data.token;
            const decoded_token = VueJwtDecode.decode(token);
            console.log('login(): user_name extracted from token', decoded_token.sub);
            this.getUserByContactNumber(userData.contactNumber);
          })
          .catch(error => {
            console.log('Login Failed', error);
          })

    },
    getUserByContactNumber(contact_number) {
      console.log('get user by contact number');
      console.log(this.get_specific_user_by_contact_number_url);
      console.log(contact_number);
      axios.get(this.get_specific_user_by_contact_number_url, {
        params: {
          "contact_number": contact_number
        }
      })
          .then(response => {
            console.log('get specific user by name successful', response.data);
            this.user_data = [];
            this.user_data.push(response.data);
            // Setting data
            window.user_data = response.data;
            // save user_data in cache -> pass to rides.vue
            localStorage.setItem('user_data', JSON.stringify(window.user_data));


            localStorage.setItem('identity', response.data.identity);

            // retrieve user id, state -> mqtt
            console.log('login: user_id: ',response.data.uid);
            localStorage.setItem('user_id', response.data.uid);
            localStorage.setItem('channel',response.data.state);
            if (response.data.identity == "driver") {
              // pass channel topic to mqtt

              console.log("driver's channel: ",localStorage.getItem('channel'))
              // redirect to users
              router.push('/users')
            } else if (response.data.identity == "passenger") {
              console.log("client request ride");
              console.log("passenger's channel: ",localStorage.getItem('channel'))
              router.push('/users')

            }

          })
          .catch(error => {
            console.log("get specific user by name failed ", error);
          })
    },
    signup(){
      axios.post('/api/v1/user/signup', {
        userName: this.signUpUsername,
        contactNumber: this.signUpContactNumber,
        identity: this.signUpIdentity,
        password: this.signUpPassword,
      }).then(response => {
        console.log("sign up response: ", response.data);
        this.signUpSuccess = 1;
      }).catch(error => {
        console.log("sign up error: ", error);
        this.signUpSuccess = 0;
      })
    }
  },
  mounted(){

  }
}
</script>

<style>

@import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');


body {
  background: #f6f5f7;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
  height: 100vh;
  margin: -20px 0 50px;
}

h1 {
  font-weight: bold;
  margin: 0;
}

h2{
  margin-left: -100px;
}

button {
  border-radius: 20px;
  border: 1px solid #FF4B2B;
  background-color: #FF4B2B;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: bold;
  padding: 12px 45px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: transform 80ms ease-in;
}

button:active {
  transform: scale(0.95);
}

button:focus {
  outline: none;
}

button.ghost {
  background-color: #FF4B2B;;
  border-color: #FFFFFF;
  color: #FFFFFF;
}

form {
  background-color: aliceblue;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 50px;
  height: 100%;
  text-align: center;
}

input {
  background-color: #eee;
  border: none;
  padding: 12px 15px;
  margin: 8px 0;
  width: 100%;
}

.container {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 14px 28px rgba(0,0,0,0.25),
  0 10px 10px rgba(0,0,0,0.22);
  position: relative;
  overflow-x: hidden;
  width: 768px;
  max-width: 1140px;
  min-height: 600px;
  display:flex;
  flex-grow: 1;
}

.form-container {
  position: absolute;
  top: 0;
  height: 100%;
  transition: transform 0.6s ease-in-out;
  display: flex;
  flex-direction: column;
}

.sign-in-container {
  left: 50%;
  width: 50%;
  z-index: 2;
  opacity: 1;
}

.container.right-panel-active .sign-in-container {
  transform: translateX(100%);
  opacity: 0;
}

.sign-up-container {
  background-color: #6a64f1;
  left: 0;
  width: 50%;
  z-index: 3;
  opacity: 0;
}

.container.right-panel-active .sign-up-container {
  transform: translateX(100%);
  opacity: 1;
}

.button-container{
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 300px;
  z-index: 4;

}


</style>