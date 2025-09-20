const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');
const schedulerService = require('./services/schedulerService');
// Initialize WhatsApp service to start authentication on startup
require('./services/whatsappService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Resume pending schedules
schedulerService.resumeSchedules();

// Helper to get list of unique group names
function getGroupNames(numbers) {
  const groups = new Set();
  numbers.forEach(n => {
    if (n.group_name) {
      groups.add(n.group_name);
    }
  });
  return Array.from(groups);
}

// Routes
app.get('/', (req, res) => {
  const numbers = db.getAllNumbers();
  const schedules = db.getAllSchedules();
  const groups = getGroupNames(numbers);
  res.render('index', { numbers, schedules, groups });
});

app.post('/numbers/add', (req, res) => {
  const { number, group } = req.body;
  if (number) {
    db.addNumber(number.trim(), group || null);
  }
  res.redirect('/');
});

app.post('/numbers/delete/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.deleteNumber(id);
  res.redirect('/');
});

app.post('/schedules/add', (req, res) => {
  const { message, sendDate, sendTime, group, numbers } = req.body;
  if (!message || !sendDate || !sendTime) {
    return res.redirect('/');
  }
  const dateTime = new Date(`${sendDate}T${sendTime}:00`);
  const iso = dateTime.toISOString();
  let numbersList = null;
  let groupName = null;
  if (group && group !== '') {
    groupName = group;
  } else if (numbers) {
    // numbers may be a single id or array of ids
    const ids = Array.isArray(numbers) ? numbers : [numbers];
    const selected = ids.map(id => {
      const record = db.getAllNumbers().find(n => n.id === parseInt(id, 10));
      return record ? record.number : null;
    }).filter(Boolean);
    numbersList = selected;
  }
  const schedId = db.addSchedule(message, iso, groupName, numbersList);
  const schedRecord = db.getAllSchedules().find(s => s.id === schedId);
  schedulerService.scheduleMessage(schedRecord);
  res.redirect('/');
});

app.post('/schedules/delete/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  schedulerService.cancelSchedule(id);
  db.deleteSchedule(id);
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});