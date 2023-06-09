const express=require("express");
const body_parser=require("body-parser");
const axios=require("axios");
require('dotenv').config();
const cors = require("cors");

const app=express().use(body_parser.json());

const token=process.env.WHATSAPP_TOKEN;
const mytoken=process.env.VERIFY_TOKEN;//prasath_token

const server = app.listen(process.env.PORT,()=>{
    console.log("webhook is listening");
});

io = require("socket.io")(server, { cors: { origin: "*" } });

//to verify the callback url from dashboard side - cloud api side
app.get("/webhook",(req,res)=>{
   let mode=req.query["hub.mode"];
   let challange=req.query["hub.challenge"];
   let token=req.query["hub.verify_token"];

    if(mode && token){

        if(mode==="subscribe" && token===mytoken){
            res.status(200).send(challange);
        }else{
            res.status(403);
        }

    }

});

let finalArray = [];

app.post("/webhook",(req,res)=>{ //i want some 

    let body_param=req.body;
    
    console.log("----------------------------------------Messages-----------------------------------------------------------");
    console.log(JSON.stringify(body_param,null,2));
    
    if(body_param.object){
        if(body_param.entry && 
            body_param.entry[0].changes && 
            body_param.entry[0].changes[0].value.messages && 
            body_param.entry[0].changes[0].value.messages[0]  
            ){
               let phon_no_id=body_param.entry[0].changes[0].value.metadata.phone_number_id;
               let from = body_param.entry[0].changes[0].value.messages[0].from; 
               let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;
               let userName = req.body.entry[0].changes[0].value.contacts[0].profile.name;
               let timestamp= body_param.entry[0].changes[0].value.messages[0].timestamp;
               let msgId= body_param.entry[0].changes[0].value.messages[0].id;
               
               finalArray.push({msgId,from,msg_body,userName,timestamp})
            
            //socket.io connection
             io.on("connection", (socket) => {
              socket.emit("originaldata", JSON.stringify(body_param,null,2));
             });
            io.on("connection", (socket) => {
              socket.emit("filtereddata", finalArray);
             });

//                axios({
//                    method:"POST",
//                    url:"https://graph.facebook.com/v13.0/"+phon_no_id+"/messages?access_token="+token,
//                    data:{
//                        messaging_product:"whatsapp",
//                        to:from,
//                        text:{
//                            body:`Hello ${userName}`
//                        }
//                    },
//                    headers:{
//                        "Content-Type":"application/json"
//                    }

//                });

//                res.sendStatus(200);
//             }else{
//                 res.sendStatus(404);
//             }

    }
});

app.get("/",(req,res)=>{
    res.status(200).send("hello this is webhook setup");
});
