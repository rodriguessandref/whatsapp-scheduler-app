const fs = require('fs');
const path = require('path');

// Path to the JSON file that stores numbers and schedules
const dataFile = path.join(__dirname, 'data.json');

// Initialize the data file if it does not exist
function initDataFile() {
  if (!fs.existsSync(dataFile)) {
    const initialData = { numbers: [], schedules: [], nextNumberId: 1, nextScheduleId: 1 };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
  }
}

function readData() {
  initDataFile();
  const raw = fs.readFileSync(dataFile);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Number operations
function getAllNumbers() {
  const data = readData();
  return data.numbers;
}

function getNumbersByGroup(groupName) {
  return getAllNumbers().filter((n) => n.group_name === groupName);
}

function addNumber(number, groupName = null) {
  const data = readData();
  // Prevent duplicates
  const exists = data.numbers.find((n) => n.number === number);
  if (exists) {
    return exists.id;
  }
  const id = data.nextNumberId++;
  data.numbers.push({ id, number, group_name: groupName });
  writeData(data);
  return id;
}

function deleteNumber(id) {
  const data = readData();
  data.numbers = data.numbers.filter((n) => n.id !== parseInt(id));
  writeData(data);
}

// Schedule operations
function getAllSchedules() {
  const data = readData();
  return data.schedules;
}

function addSchedule(message, sendAtISO, groupName = null, numbersList = null) {
  const data = readData();
  const id = data.nextScheduleId++;
  data.schedules.push({ id, message, send_at: sendAtISO, group_name: groupName, numbers: numbersList, sent: false });
  writeData(data);
  return id;
}

function deleteSchedule(id) {
  const data = readData();
  data.schedules = data.schedules.filter((s) => s.id !== parseInt(id));
  writeData(data);
}

function markScheduleSent(id) {
  const data = readData();
  const schedule = data.schedules.find((s) => s.id === parseInt(id));
  if (schedule) {
    schedule.sent = true;
    writeData(data);
  }
}

module.exports = {
  getAllNumbers,
  getNumbersByGroup,
  addNumber,
  deleteNumber,
  getAllSchedules,
  addSchedule,
  deleteSchedule,
  markScheduleSent
};