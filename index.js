const express = require("express");
const app = express();

app.use(express.urlencoded({extended: true}));


app.get("/test", function(req, res){
    return res.status(200).send("Test");
});


const port = 3000;
app.listen(port, function(){
    console.log(`listening on port ${port}`);
});