const express=require('express')
const app=express()
const jwt =require('jsonwebtoken') 
app.use(express.json())


 
const users =[
    {
        id:"1",
        username:"ananthu",
        password:"123",
        isAdmin:true
    },
    {
        id:"2",
        username:"sandeep",
        password:"1234",
        isAdmin:false
    }
];
const generateAccessToken=(user)=>{
    //ACCESS-TOKEN
   return jwt.sign(
     {id:user.id, isAdmin:user.isAdmin},
     "mySecretKey",
     {expiresIn:"2m"}
     )
 }
 const generateRefreshToken=(user)=>{
     //REFRESH-TOKEN
     return jwt.sign(
         {id:user.id, isAdmin:user.isAdmin},
         "myRefreshSecretKey",
         ) 
    //NO expiray time or day on refresh token
  }
app.get("/",(req,res)=>{
    res.send("hello world")
})

 //REFRESH TOKEN
let refreshTokenArray=[]

app.post('/api/refresh',(req,res)=>{
//take the refresh token from the user
const refreshToken = req.body.token//this is REFRESH-TOKEN
//send error  if there is no token or its invalid
if(!refreshToken){
    return res.status(401).json('You are not authenticated(refresh token)')
}
if(!refreshTokenArray.includes(refreshToken)){//if refresh token not inside our db/or refreshToken array we return a error//! we push the token when the first time the user logged in into our website to the refresh token array for further verification
return res.status(403).json("Refresh token is not valid")
} 
//if it valid - let's validate
jwt.verify(refreshToken,"myRefreshSecretKey",(err,user)=>{
    if(err){
        err && console.log("ERROR..",err)
    }
    refreshToken=refreshTokenArray.filter((token)=>token !== refreshToken)//if refresh token equalto refresh token it will delete other wise it stay in the array'

    const newAccessToken =(generateAccessToken(user))
    const newRefreshToken =(generateRefreshToken(user))

    refreshTokenArray.push(newRefreshToken)

})
//if everything is ok  create new ACCESS-TOKEN && REFRESH-TOKEN
})


app.post('/api/login',(req,res)=>{
    const {username,password}=req.body
    const user = users.find(u=>{ 
        return u.username===username && u.password===password
    })
    if(user){
    //Generating both tokens and assigning to user
    //ACCESS-TOKEN
  const  accessToken= generateAccessToken(user)
    //REFRESH-TOKEN
  const refreshToken= generateRefreshToken(user)

  refreshTokenArray.push(refreshToken) 

    res.json({
        username:user.username,
        isAdmin:user.isAdmin,
        accessToken,
     })
    }
    else{
        res.status(400).json("username or password incorect")
    }
})

const verify=(req,res,next)=>{
    console.log("auth Verify..",req.body)   
    const authHeader = req.headers.authorization;
    if(authHeader){
        const token = authHeader.split(" ")[1]//removing Bearer text from recived token  with split method by space and second postion of array [1]<= this where the token

        jwt.verify(token,"mySecretKey",(err,user)=>{
            if(err){
                return res.status(403).json("Token is not valid")
            }
            else{
                console.log("jwt.veryfy...user..",user)
                req.user=user
                next();
            }
        })
    }
    else{
        res.status(401).json("You are not authenticated")
    }
}




app.delete('/api/users/:userId',verify,(req,res)=>{
    if(req.user.id === req.params.userId || req.user.isAdmin ){//is admin true(now this case ananthu is admin thats means on.y anthu can delete his account )
        res.status(200).json("user has been deleted..")
    }
    else{
        res.status(403).json("You are not allowed to delete this user (your not admin)") //beacuse this admin is false
    }
})


app.listen(5000,()=>{console.log("server started")})