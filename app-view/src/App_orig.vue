
<script>

export default {
  name: 'App',
  components: {

  },
  beforeCreate() {
    let ckeditor = document.createElement('script');
    ckeditor.setAttribute('src', "//code.jquery.com/jquery-3.3.1.slim.min.js");
    document.head.appendChild(ckeditor);

    let ckeditor1 = document.createElement('script');
    ckeditor.setAttribute('src', "//cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js");
    document.head.appendChild(ckeditor1);

    let ckeditor2 = document.createElement('script');
    ckeditor.setAttribute('src', "//stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js");
    document.head.appendChild(ckeditor2);
  }
}
</script>
<template>
  <div id="app">
    <header>
      <link href="https://fonts.googleapis.com/css?family=Nunito:200,600" rel="stylesheet">

    </header>

    <router-view></router-view>
    <Footer/>
  </div>
</template>

<style>
@import "bootstrap/dist/css/bootstrap.min.css";

#app {
  position: relative;
}

</style>
