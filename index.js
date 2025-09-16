const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

// Middleware
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static('public'))

// Home
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})

// 1. Connect MongoDB
mongoose.connect('mongodb+srv://vishal:vishal2102@cluster0.7dw8zod.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err))

// 2. Define schemas
const { Schema } = mongoose

const exerciseSchema = new Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
}, { _id: false })

const userSchema = new Schema({
  username: { type: String, required: true },
  log: [exerciseSchema]
})

const User = mongoose.model('User', userSchema)

// 3. Routes
// Create user
app.use(express.urlencoded({ extended: true }))

// Create User
app.post('/api/users', async (req, res) => {
  try {
    const username = req.body.username
    if (!username) return res.status(400).json({ error: 'Username is required' })

    const user = new User({ username })
    await user.save()
    res.json({ username: user.username, _id: user._id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get All Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id')
    res.json(users) // will be an array of objects
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body
  const user = await User.findById(req.params._id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const exercise = {
    description,
    duration: Number(duration),
    date: date ? new Date(date) : new Date()
  }
  user.log.push(exercise)
  await user.save()

  res.json({
    _id: user._id,
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  })
})

// Get logs
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query
  const user = await User.findById(req.params._id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  let logs = user.log.map(l => ({
    description: l.description,
    duration: l.duration,
    date: l.date.toDateString()
  }))

  if (from) {
    const fromDate = new Date(from)
    logs = logs.filter(l => new Date(l.date) >= fromDate)
  }
  if (to) {
    const toDate = new Date(to)
    logs = logs.filter(l => new Date(l.date) <= toDate)
  }
  if (limit) {
    logs = logs.slice(0, Number(limit))
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: logs.length,
    log: logs
  })
})

// Listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
