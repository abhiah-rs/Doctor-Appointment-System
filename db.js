var mongoose = require("mongoose");

var url = "mongodb://test:test@ac-okdwikq-shard-00-00.u6hft1w.mongodb.net:27017,ac-okdwikq-shard-00-01.u6hft1w.mongodb.net:27017,ac-okdwikq-shard-00-02.u6hft1w.mongodb.net:27017/doctorDB?ssl=true&replicaSet=atlas-luvuya-shard-0&authSource=admin&appName=Cluster0";

mongoose
.connect(url)
    .then(() => {
      console.log("Connected to db");
    })
    .catch((error) => {
      console.log(error);
  });

