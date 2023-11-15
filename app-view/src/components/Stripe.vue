<template>
  <section class="row payment-form">

    <h5 class="col s12 #e0e0e0 grey lighten-4">
      Payment Method
      <span class="right">${{ totalPrice }}</span>
    </h5>

    <div class="col s12 error red center-align white-text"></div>

    <div class="col s12 card-element">
      <label>Card Number</label>
      <div id="card-number-element" class="input-value"></div>
    </div>

    <div class="col s6 card-element">
      <label>Expiry Date</label>
      <div id="card-expiry-element"></div>
    </div>

    <div class="col s6 card-element">
      <label>CVC</label>
      <div id="card-cvc-element"></div>
    </div>

    <div class="col s12 place-order-button-block">
      <button class="btn col s12 pink" @click="placeOrderButtonPressed">Place Order</button>
    </div>
  </section>
</template>

<script>
import axios from "axios";
export default {
    name: "stripe-view",
    props:{
        orderId: Number,
        totalPrice: Number,
    },
    data(){
        return{
            stripe: null,
            cardNumberElement: null,
            cardCVCElement: null,
            stripeValidationError: "",
            amount: this.totalPrice,

        };
    },
    mounted(){
        this.stripe = window.Stripe("pk_test_51O2TMUIOY9ZeQ6Hb1uyXYDkoEoYmVIFlrFRzRimQEu5JMT02aE0ZANkQ9GthsiELmdMBKEsnCsFcfpzT2JNQ6FxY007Td5c4Mq");
        this.createAndMountFormElements();
    },
    methods: {
        createAndMountFormElements(){
            let elements  = this.stripe.elements();
            this.cardNumberElement = elements.create("cardNumber");
            this.cardNumberElement.mount("#card-number-element");

            this.cardExpiryElement = elements.create("cardExpiry");
            this.cardExpiryElement.mount("#card-expiry-element");

            this.cardCvcElement = elements.create("cardCvc");
            this.cardCvcElement.mount("#card-cvc-element");

            this.cardNumberElement.on("change", this.setValidationError);
            this.cardExpiryElement.on("change",this.setValidationError);
            this.cardCvcElement.on("change",this.setValidationError);
        },
        setValidationError(event){
            this.stripeValidationError = event.error?event.error.message: "";
        },
        placeOrderButtonPressed(){
            this.stripe.createToken(this.cardNumberElement).then(result => {
                if(result.error){
                    this.stripeValidationError = result.error.message;
                    console.log("stripeValidationerror", this.stripeValidationError);
                }
                else{
                    let stripeObject = {
                        amount: this.amount,
                        source: result.token
                    };
                    console.log("stripeObject", stripeObject);
                    console.log("props: ", this.orderId);
                    this.processPaymentResult(this.orderId);

                }

            })
        },
        processPaymentResult(orderId){
            let success_json = {
              "success": true
            }
            axios.post(`/api/v1/order/payment/result/${orderId}`, success_json,{
              headers:
                 {"Content-Type": "application/json"}

            })
                .then(response => {
                    console.log("payment request: ", response.data);
            })
                .catch(error => {
                    console.log("payment request failed: ", error);
            })
        }

    }
};
</script>

<style>
.payment-form {
  margin-top: 20px;
  max-width: 800px;

  border: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  font-size: 1.5rem;
}

.payment-form h5 {
  margin: 0;
  padding: 1em;
}

.payment-form label{
    margin-bottom: 3px;

}
.payment-form .card-element{
    padding: 10px;
    border-bottom: none;
}

.payment-form .card-element:last-child{
  border-bottom: none;
}
.error{
    margin: 12px 0;
}


#card-number-element,
#card-expiry-element,
#card-cvc-element {
  background: white;
  padding: 8px;
  border: 1px solid #ececec;

}

.place-order-button-block {

    background-color: #FF4B2B;
    border: 1px;

    width: 200px;
    margin: 30px auto;
    color: white;
    radius: 2 rem;
}
</style>