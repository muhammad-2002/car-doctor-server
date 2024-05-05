const express = require('express')
const cors = require('cors')
require('dotenv').config()
const prot = process.env.PORT || 3000
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express()


//middleware
app.use(express.json())
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}))
app.use(cookieParser())

//mongodb

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://Car-doctor:PF8DOhuVL01SmNkB@cluster0.iwngqer.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//my middleware


const varifyToken = async(req,res,next)=>{
  const token = req.cookies?.token
  console.log(token)
  if(!token){
    return res.status(401).send({message:'unAuthorized'})
  }
  jwt.verify(token,process.env.JWT_SERECT,(err,decode)=>{
    if(err){
      console.log(err)
      return res.status(401).send('unAuthorize')
    }
    console.log('Decoded token:', decode);
    req.user= decode;
    next()
  })

}

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

  //data get with quarry
  app.get('/booking',varifyToken,async(req,res)=>{
    if(req.user.email !== req.query?.email){
      return res.status(403).send({message:'forbidden'})
    }
    let quarry ={}
    if(req.query?.email){
      
      quarry = {email:req.query.email}
      const result = await bookingCollection.find(quarry).toArray()
     
      // console.log(req.cookies.token)
      res.send(result)
    }
  })
  //set cookie 
  app.post('/jwt',(req,res)=>{
    const user = req.body
    const token = jwt.sign(user,process.env.JWT_SERECT,{
        expiresIn:'1h'
    })

    res.cookie('token',token,{
      httpOnly:true,
      secure:false,
   


    })  
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