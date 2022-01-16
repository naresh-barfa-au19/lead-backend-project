const express = require("express");
const app = express()
require("dotenv").config()
const https = require("https");
app.use(express.json())

var webData = ""
var webDataArr = []
const getData = async () => {
    await https.get(process.env.ECO_URL, (response) => {
        response.on("data", (chunk) => {
            webData += chunk;
        });
        response.on("end", () => {
            webData = webData.split("\n")
            webData.map((obj) => {
                let newObj = {}
                if (obj.match("<font face='arial,helvetica'>")) {
                    let end = obj.indexOf("</font>")
                    let temp = obj.substr(end - 3, end)
                    end = temp.indexOf("</font>")
                    temp = temp.substr(0, end)
                    newObj["code"] = temp
                }
                if (obj.match("<font face='arial,helvetica'>")) {
                    let start = obj.indexOf("<B>")
                    let end = obj.indexOf("</B><br>")
                    let temp = obj.substr(start + 3, end)
                    end = temp.indexOf("</B><br>")
                    temp = temp.substr(0, end)
                    newObj["comment"] = temp
                    webDataArr.push(newObj)
                }
                if (obj.match("<font size=-1>")) {
                    let start = obj.indexOf("<font size=-1>")
                    let end = obj.indexOf("</font>")
                    let temp = obj.substr(start + 14, end)
                    end = temp.indexOf("</font>")
                    temp = temp.substr(0, end)
                    const len = webDataArr.length
                    webDataArr[len-1]["move"] = temp
                }
            })
        });
    })
        .on("error", (err) => {
            console.log(err.message);
        });

}
getData();




app.get("/", async (req, res) => {
    res.send(webDataArr)
})

app.get("/:codeInfo",async(req,res)=>{
    const codeInfo = req.params.codeInfo;
    const output = await webDataArr.filter((obj)=>{
        if(obj.code === codeInfo){
            return obj
        }
    })
    res.status(200).send(output)
})

app.use("/",async(req,res,next)=>{
    const codeInfo = req.path
    const reqList = codeInfo.split("/")
    const code = reqList[1]
    const lastMove = reqList[reqList.length-1]
    const output = await webDataArr.filter((obj)=>{
        if(obj.code === code){
            return obj
        }
    })
    let tempMove = await output[0].move.split(" ")
    tempMove.push("end")
    let nextMove = ""
    for(let i =0; i<tempMove.length;i++){
        if(tempMove[i] === lastMove){
            if(tempMove[i+1] !== "end" ){
                nextMove = tempMove[i+1]
            }
            if(tempMove[i+1] !== "end" && Number.isInteger(parseInt(tempMove[i+1]))){
                nextMove = tempMove[i+2]
            }
        }
    }
    
    res.send({
        "nextMove":nextMove
    })
})

app.listen(process.env.PORT, () => {
    console.log(`server is running on port : ${process.env.PORT}`)
})