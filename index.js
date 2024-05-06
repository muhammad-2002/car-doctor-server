const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser =require('cookie-parser')

require('dotenv').config()
const prot = process.env.PORT || 3000


const app = express()


//middleware
app.use(express.json())
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://car-doctor-8dad4.web.app",
      "https://car-doctor-8dad4.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser())

//myOwn Middleware


//mongodb

const { MongoClient, ServerApiVersion, ObjectId, MaxKey } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iwngqer.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//my middleware
const verifyToken =(req,res,next)=>{
  const token =req.cookies?.token
  if(!token){
    return res.status(401).send('unAuthorize')
  }
  jwt.verify(token,process.env.JWT_SERECT,(err,decoded)=>{
    if(err){
      res.status(401).send('unAuthorize')
    }
    req.user = decoded
    next()
  })

}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};



async function run() {
  try {
    const database = client.db("Car_doctor");
    const serviceCollection = database.collection("services");
    const bookingCollection = database.collection("booking");

    app.get('/services',async(req,res)=>{
     
        const query= serviceCollection.find()
        const result = await query.toArray()

        
   
        res.send(result)
    })
app.post('/logout',(req,res)=>{
  const token = req.body.cookie
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 }).send({status:true})
})
  //data get with quarry
  app.get('/booking',verifyToken,async(req,res)=>{
    
    let quarry ={}
    if(req.query?.email){
      
      quarry = {email:req.query.email}
      const result = await bookingCollection.find(quarry).toArray()
     const user = req.user?.email
     console.log(user)
     if(req.query.email!== user){
      return res.status(403).send('forbidden')

     }
      // console.log(req.cookies.token)
      res.send(result)
    }
  })
  
//set cookie 
app.post('/jwt',(req,res)=>{
  const user = req.body
  const token = jwt.sign(user,process.env.JWT_SERECT,{expiresIn:'1h'})
  res.
  cookie('token',token,cookieOptions)
  .send({status:true})

})


  //patch data in axios
  app.patch('/booking/:id' ,async(req,res)=>{
    const id = req.params.id
    console.log(id)
    const quarry = {_id:new ObjectId(id)}
   
    const body = req.body
    console.log(body)
    const updateDoc = {
      $set: {
        status:body.status
      },
    };
    const result = await bookingCollection.updateOne(quarry, updateDoc);
    res.send(result)
  })
  app.delete('/booking/:id',async(req,res)=>{
    const id = req.params.id;
    const quarry = {_id:new ObjectId(id)}
    const result = await bookingCollection.deleteOne(quarry)
    res.send(result)
  })

  
    app.get('/services/:id', async(req,res)=>{
      const id = req.params.id
      console.log(id)
      const query ={_id: new ObjectId(id)}
      const options = {
        projection: {  title: 1 ,price:1, image:1},
      }
      const result = await serviceCollection.findOne(query,options)
      res.send(result)

    })
    app.post('/booking',async(req,res)=>{
      const data = req.body;
    // Insert the defined document into the "haiku" collection
    const result = await bookingCollection.insertOne(data);
    res.send(result)

    })
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("Car-doctor").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


//listening 
app.listen(prot, (()=>console.log(`listening prot ${prot}`)))