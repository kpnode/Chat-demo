const mongoose = require("mongoose")

const conn=mongoose.connect("mongodb://localhost:27017/chatapp2")
.then(()=>console.log("Successfully connected"))
.catch((err)=>{console.log("error occur",err)})

module.exports =conn;