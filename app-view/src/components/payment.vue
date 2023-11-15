<script>
import axios from 'axios'
import Stripe from '/src/components/Stripe.vue'
export default{
    name: "payment-view",
    data(){
        return{
            shouldOpenPayment: false,
            order_param_rid: this.$route.params.rid,
            order: '',
            loadPayment: false,
            stripePublicKey: "pk_test_51O2TMUIOY9ZeQ6Hb1uyXYDkoEoYmVIFlrFRzRimQEu5JMT02aE0ZANkQ9GthsiELmdMBKEsnCsFcfpzT2JNQ6FxY007Td5c4Mq",
            stripeSecretKey: "sk_test_51O2TMUIOY9ZeQ6Hbehi2xWwJo2RW6POzOT5MJjNoc4PivgmTn6Z9eKOc6B7oEZZHCHUu7FGiI3W8aL7upaVVuIY000ob44RDsI",
            totalPrice:'',
        }
    },
    methods:{
        openPaymentPage(){
            console.log("inside openPaymentPage method");
            this.shouldOpenPayment = true;
            this.order = new Map();
            //if(this.check_if_order_exist())
            this.createOrder();
        },
        convert_response_to_jsonObj(raw_text){
            let map = new Map(Object.entries(JSON.parse(raw_text)));
            let mapArray = Array.from(map);
            let mapObject = Object.fromEntries(mapArray);
            return mapObject;
        },
        check_if_order_exist(orderId){
            axios.get(`/api/v1/order/${orderId}`)
                .then(response => {
                    console.log("check if order exist response: ", orderId);
                    console.log(response.data);
                    if(response.data.data == null){
                        console.log("order does not exist");
                        return false;
                    }
                    if(response.data.data != null){
                        return response.data.data;
                    }

                })
                .catch(error => {
                  console.log("check if order exist error", error);
                })
        },
        createOrder(){
            console.log("inside createOrder");
            let rideId = {
                "rid": this.order_param_rid
            }
            axios.post(
                "/api/v1/order", rideId, {
                    headers: {'Content-Type': 'application/json'}
                }
            ).then(response => {
                console.log("response.data", response.data);
                this.order = response.data.data;
                let orderId = this.order.orderId
                this.totalPrice = this.order["totalPrice"];
                console.log("orderId: ", orderId);
                this.loadCheckout(orderId);
            }).catch(error => {
                console.log("error", error);
            })
        },
        loadCheckout(orderId){
            axios.get(`/api/v1/order/payment/${orderId}`)
                .then(response => {
                    console.log("load checkout response: ", response.data);
                    this.loadPayment = true;

                })
                .catch(error => {
                    console.log("load checkout error: ", error);
                })

        },
        // setup_stripe_elements(){
        //     const script = document.createElement('script');
        //     script.src = 'https://checkout.stripe.com/checkout.js';
        //     script.async = true;
        //     script.onload = () => {
        //       this.initialize_stripe_elements();
        //     }
        //
        //
        //     script.className = 'stripe-button';
        //     script.dataset.key = this.stripePublicKey;
        //     script.dataset.amount = 1000;
        //     script.dataset.currency = "USD";
        //     script.dataset.name = 'Baeldung';
        //     // script.dataset.description = 'Spring course checkout';
        //     // script.dataset.image = 'http://www.baeldung.com/wp-content/themes/baeldung/favicon/android-chrome-192x192.png';
        //     // script.dataset.locale = 'auto';
        //     // script.dataset.zipCode = 'false';
        //
        //     document.getElementById('stripe-button-container').appendChild(script);
        // },
        // submit_stripe_checkout(){
        //   this.$refs.checkoutRef.redirectToCheckout();
        // }
    },
    components:{

        Stripe
    },
    mounted(){
        this.shouldOpenPayment = false;

    }
}

</script>

<template>
    <body>
        <div class="payment-container">

            <div v-if="shouldOpenPayment">
              <table class="order-container">
                <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(value, key) in this.order" :key="key">
                  <td>{{ key }}</td>
                  <td>{{ value }}</td>
                </tr>
                </tbody>
              </table>
            </div>

            <div class="open_payment_btn"  :class="{ 'relative-btn': shouldOpenPayment }">
              <button @click="openPaymentPage" >open payment page</button>
            </div>
            <div v-if="loadPayment">
                <p>Load Payment View</p>
                <div>

                </div>
            </div>
            <div class="stripe-container">
              <Stripe :orderId="this.order.orderId" :totalPrice="this.totalPrice"/>
            </div>
        </div>


    </body>
</template>

<style>

.payment-container{
    display: flex;
    flex-direction: column;
}

.order-container{
  width: 100%;
  border-collapse: collapse;
}


.order-container th{
  background-color: #f2f2f2;
}
.order-container th, .order-container td {
    border: 1px solid #ddd; /* add border to cells */
    padding: 8px;
    text-align: left;
    width: 120px;
}

.order-container th{
    background-color: #f2f2f2;
}
.order-container td:first-child {
    font-weight: bold;
    width: 60px;
}

.order-container td:last-child {
  font-style: italic;
}

.open_payment_btn{

  margin-top: 10px;
}


.relative-btn {
  position: relative;
  top: 20px; /* Adjust the value based on your design */
}
.stripe-container{
    width: 600px;
    height: 100%;
}


</style>