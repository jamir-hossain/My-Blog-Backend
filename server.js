const express = require('express');
const app = express()
const cors = require('cors');
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

// Middleware
app.use(cors())
dotenv.config()
// app.use(express.json())
app.use(bodyParser.json())
// app.use(express.urlencoded({extended: false}))
app.use(cookieParser(process.env.JWT_SECRET))

// import auth route
const authRoute = require('./Routes/authRoute')
app.use('/user', authRoute)

// import profile route
const profileRoute = require('./Routes/profileRoute')
app.use('/user', profileRoute)

// import profile route
const articleRoute = require('./Routes/articleRoute')
app.use('/', articleRoute)

// import comment route
const commentRoute = require('./Routes/commentRoute')
app.use('/', commentRoute)

// import like dislike route
const LikeDislikeRoute = require('./Routes/LikeDislikeRoute')
app.use('/', LikeDislikeRoute)

// import follow unFollow route
const FollowUnFollowRoute = require('./Routes/followUnfollowRoute')
app.use('/', FollowUnFollowRoute)

// Application root route
app.get('/', (req, res) => {
   res.send({result:'My Blog Server is running'})
})

// Database Connection
const DBConnection = require('./DBConnection/DBConnection')
DBConnection()


let PORT = process.env.PORT || 3005
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`) )