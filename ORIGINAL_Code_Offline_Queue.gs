const CONFIG = {
  SCHOOL: "GOVT. HIGHER SECONDARY SCHOOL NASEER KILLI, MARDAN",
  PHONE: "03348435318",
  TIMEZONE: "Asia/Karachi",
  SESSION_SECONDS: 21600,
  SHEETS: {
    STUDENTS: "Students",
    ATTENDANCE: "Attendance",
    ABSENT: "Absent Students",
    SUMMARY: "Class Summary",
    LOGIN: "Login Settings",
    FINE_PAYMENTS: "Fine Payments",
    OFFLINE_LOG: "Offline Sync Log"
  }
};

// ---------------- WEB APP ----------------
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("GHSS Naseer Killi | Attendance System")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ---------------- INITIAL SETUP ----------------
function setupAttendanceSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("اس Apps Script کو اپنی Google Sheet کے ساتھ کھولیں۔");

  createSheet_(ss, CONFIG.SHEETS.STUDENTS,
    ["Roll No", "Student Name", "Father Name", "Class", "Parent Mobile"]);
  createSheet_(ss, CONFIG.SHEETS.ATTENDANCE,
    ["Date", "Class", "Roll No", "Student Name", "Father Name", "Parent Mobile", "Status", "Marked By", "Timestamp"]);
  createSheet_(ss, CONFIG.SHEETS.ABSENT,
    ["Date", "Class", "Roll No", "Student Name", "Father Name", "Parent Mobile", "Status", "Marked By", "Timestamp"]);
  createSheet_(ss, CONFIG.SHEETS.SUMMARY,
    ["Date", "Class", "Total", "Present", "Absent", "C/Leave"]);
  createSheet_(ss, CONFIG.SHEETS.FINE_PAYMENTS,
    ["Payment Date", "Month", "Class", "Roll No", "Student Name", "Amount Paid", "Received By", "Timestamp"]);
  createSheet_(ss, CONFIG.SHEETS.OFFLINE_LOG,
    ["Batch ID", "Synced At", "Class", "Attendance Date", "Result"]);
  const login = createSheet_(ss, CONFIG.SHEETS.LOGIN,
    ["Username", "Role", "Salt", "Password Hash"]);

  const users = login.getLastRow() > 1
    ? login.getRange(2, 1, login.getLastRow() - 1, 1).getDisplayValues().flat().map(x => String(x).toLowerCase())
    : [];
  if (!users.includes("teacher")) addLogin_("teacher", "TEACHER", "12345");
  if (!users.includes("principal")) addLogin_("principal", "PRINCIPAL", "12345");

  SpreadsheetApp.flush();
  return "Setup completed. تمام شیٹس تیار ہیں۔";
}

function createSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  else {
    const first = sh.getRange(1, 1, 1, Math.max(headers.length, sh.getLastColumn())).getDisplayValues()[0];
    if (first.every(v => !v)) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#17365D").setFontColor("#FFFFFF");
  return sh;
}

// ---------------- LOGIN / PASSWORD ----------------
function addLogin_(username, role, password) {
  const sh = getSheet_(CONFIG.SHEETS.LOGIN);
  const salt = Utilities.getUuid();
  sh.appendRow([username, role, salt, hashPassword_(salt, password)]);
}

function hashPassword_(salt, password) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + String(password), Utilities.Charset.UTF_8);
  return bytes.map(b => ("0" + ((b + 256) % 256).toString(16)).slice(-2)).join("");
}

function login(username, password) {
  setupIfLoginMissing_();
  username = String(username || "").trim().toLowerCase();
  password = String(password || "");
  if (!username || !password) throw new Error("Username اور Password درج کریں۔");

  const data = getSheet_(CONFIG.SHEETS.LOGIN).getDataRange().getDisplayValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() !== username) continue;
    if (hashPassword_(data[i][2], password) !== data[i][3]) throw new Error("غلط Username یا Password۔");

    const token = Utilities.getUuid();
    const user = {username: data[i][0], role: String(data[i][1]).toUpperCase()};
    CacheService.getScriptCache().put("SESSION_" + token, JSON.stringify(user), CONFIG.SESSION_SECONDS);
    return {token, user};
  }
  throw new Error("غلط Username یا Password۔");
}

function setupIfLoginMissing_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Google Sheet کے ساتھ Apps Script کھولیں۔");
  let sh = ss.getSheetByName(CONFIG.SHEETS.LOGIN);
  if (!sh) sh = createSheet_(ss, CONFIG.SHEETS.LOGIN, ["Username", "Role", "Salt", "Password Hash"]);
  if (sh.getLastRow() < 1) sh.appendRow(["Username", "Role", "Salt", "Password Hash"]);
  const users = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues().flat().map(x => String(x).toLowerCase()) : [];
  if (!users.includes("teacher")) addLogin_("teacher", "TEACHER", "12345");
  if (!users.includes("principal")) addLogin_("principal", "PRINCIPAL", "12345");
}

function getSession_(token) {
  if (!token) throw new Error("آپ کا سیشن ختم ہو گیا ہے۔ دوبارہ لاگ اِن کریں۔");
  const value = CacheService.getScriptCache().get("SESSION_" + token);
  if (!value) throw new Error("Session expired. دوبارہ لاگ اِن کریں۔");
  return JSON.parse(value);
}

function logout(token) {
  if (token) CacheService.getScriptCache().remove("SESSION_" + token);
  return true;
}

function changePassword(token, oldPassword, newPassword) {
  const user = getSession_(token);
  if (String(newPassword || "").length < 5) throw new Error("نیا Password کم از کم 5 حروف یا اعداد کا ہونا چاہیے۔");
  const sh = getSheet_(CONFIG.SHEETS.LOGIN);
  const data = sh.getDataRange().getDisplayValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() !== user.username.toLowerCase()) continue;
    if (hashPassword_(data[i][2], oldPassword) !== data[i][3]) throw new Error("پرانا Password درست نہیں ہے۔");
    const salt = Utilities.getUuid();
    sh.getRange(i + 1, 3, 1, 2).setValues([[salt, hashPassword_(salt, newPassword)]]);
    return "Password کامیابی سے تبدیل ہوگیا۔";
  }
  throw new Error("User نہیں ملا۔");
}

// ---------------- SHEET HELPERS ----------------
function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Active Google Spreadsheet نہیں ملی۔");
  let sh = ss.getSheetByName(name);
  if (!sh && name === CONFIG.SHEETS.LOGIN) sh = createSheet_(ss, name, ["Username", "Role", "Salt", "Password Hash"]);
  if (!sh) throw new Error('Sheet "' + name + '" نہیں ملی۔');
  return sh;
}

function normalize_(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getStudentColumns_(sh) {
  const lastCol = sh.getLastColumn();
  if (!lastCol) throw new Error("Students شیٹ میں کالم موجود نہیں۔");
  const headers = sh.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const find = aliases => {
    for (let i = 0; i < headers.length; i++) if (aliases.includes(normalize_(headers[i]))) return i;
    return -1;
  };
  const cols = {
    roll: find(["rollno", "rollnumber", "classrollno", "srno", "serialno"]),
    name: find(["studentname", "name", "student"]),
    father: find(["fathername", "father"]),
    className: find(["class", "classname", "classsection", "classandsection"]),
    mobile: find(["parentmobile", "parentnumber", "mobileno", "mobile", "contact"])
  };
  const missing = [];
  if (cols.roll < 0) missing.push("Roll No");
  if (cols.name < 0) missing.push("Student Name");
  if (cols.father < 0) missing.push("Father Name");
  if (cols.className < 0) missing.push("Class");
  if (missing.length) throw new Error("Students شیٹ میں یہ کالم موجود نہیں: " + missing.join(", "));
  return cols;
}

function getStudentsData_() {
  const sh = getSheet_(CONFIG.SHEETS.STUDENTS);
  if (sh.getLastRow() < 2) return [];
  const cols = getStudentColumns_(sh);
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getDisplayValues();
  return values.filter(r => r[cols.name] && r[cols.className]).map(r => ({
    roll: String(r[cols.roll]).trim(),
    name: String(r[cols.name]).trim(),
    father: String(r[cols.father] || "").trim(),
    className: String(r[cols.className]).trim(),
    mobile: cols.mobile >= 0 ? String(r[cols.mobile] || "").trim() : ""
  }));
}

function today_() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
}

// ---------------- TEACHER / CLASS ----------------
function getClasses(token) {
  const user = getSession_(token);
  if (!["TEACHER", "PRINCIPAL"].includes(user.role)) throw new Error("Access denied.");
  return [...new Set(getStudentsData_().map(s => s.className))].sort((a, b) => a.localeCompare(b, undefined, {numeric:true}));
}

function getStudents(token, className, date) {
  const user = getSession_(token);
  if (!["TEACHER", "PRINCIPAL"].includes(user.role)) throw new Error("Access denied.");
  className = String(className || "").trim();
  if (!className) throw new Error("Class منتخب کریں۔");
  const students = getStudentsData_().filter(s => s.className.toUpperCase() === className.toUpperCase());
  const existing = getAttendanceForClass_(date || today_(), className);
  const byRoll = {};
  existing.forEach(r => byRoll[String(r.roll)] = r.status);
  return students.map(s => ({...s, status: byRoll[s.roll] || "Present"}));
}

function getAttendanceForClass_(date, className) {
  const sh = getSheet_(CONFIG.SHEETS.ATTENDANCE);
  if (sh.getLastRow() < 2) return [];
  const values = sh.getRange(2, 1, sh.getLastRow() - 1, 9).getDisplayValues();
  return values.filter(r => String(r[0]).trim() === String(date).trim() &&
    String(r[1]).trim().toUpperCase() === String(className).trim().toUpperCase())
    .map(r => ({roll:String(r[2]||"").trim(), name:r[3], father:r[4], mobile:r[5], status:r[6]}));
}

function saveAttendance(token, className, date, records) {
  const user = getSession_(token);
  if (user.role !== "TEACHER") throw new Error("صرف Teacher حاضری محفوظ کر سکتا ہے۔");
  className = String(className || "").trim();
  date = date || today_();
  if (!className || !Array.isArray(records) || !records.length) throw new Error("Class یا طلبہ کا ریکارڈ موجود نہیں۔");
  const allowed = ["Present", "Absent", "C/Leave"];
  records.forEach(r => { if (!allowed.includes(r.status)) throw new Error("غلط Attendance Status۔"); });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const attendance = getSheet_(CONFIG.SHEETS.ATTENDANCE);
    const absent = getSheet_(CONFIG.SHEETS.ABSENT);
    const summary = getSheet_(CONFIG.SHEETS.SUMMARY);
    deleteClassDateRows_(attendance, date, className);
    deleteClassDateRows_(absent, date, className);
    deleteClassDateRows_(summary, date, className);

    const now = new Date(), rows = [], absentRows = [];
    let present = 0, absentCount = 0, leave = 0;
    records.forEach(r => {
      if (r.status === "Present") present++;
      if (r.status === "Absent") absentCount++;
      if (r.status === "C/Leave") leave++;
      const row = [date, className, r.roll, r.name, r.father || "", r.mobile || "", r.status, user.username, now];
      rows.push(row);
      if (r.status === "Absent" || r.status === "C/Leave") absentRows.push(row);
    });
    if (rows.length) attendance.getRange(attendance.getLastRow()+1, 1, rows.length, 9).setValues(rows);
    if (absentRows.length) absent.getRange(absent.getLastRow()+1, 1, absentRows.length, 9).setValues(absentRows);
    summary.appendRow([date, className, records.length, present, absentCount, leave]);
    return {message:"حاضری کامیابی سے محفوظ ہوگئی۔", total:records.length, present, absent:absentCount, leave};
  } finally {
    lock.releaseLock();
  }
}

function deleteClassDateRows_(sh, date, className) {
  if (sh.getLastRow() < 2) return;
  const data = sh.getRange(2, 1, sh.getLastRow()-1, 2).getDisplayValues();
  for (let i = data.length-1; i >= 0; i--) {
    if (String(data[i][0]) === String(date) && String(data[i][1]).toUpperCase() === String(className).toUpperCase()) sh.deleteRow(i+2);
  }
}

// ---------------- EDIT STUDENT PROFILE ----------------
function updateStudentDetails(token, className, roll, name, father, mobile) {
  const user = getSession_(token);
  if (user.role !== "TEACHER") throw new Error("صرف Teacher طلبہ کی معلومات تبدیل کر سکتا ہے۔");
  className = String(className || "").trim();
  roll = String(roll || "").trim();
  name = String(name || "").trim();
  father = String(father || "").trim();
  mobile = String(mobile || "").trim();
  if (!className || !roll || !name) throw new Error("Class، Roll No اور Student Name لازمی ہیں۔");

  const sh = getSheet_(CONFIG.SHEETS.STUDENTS);
  let cols = getStudentColumns_(sh);
  if (cols.mobile < 0) {
    const newCol = sh.getLastColumn() + 1;
    sh.getRange(1, newCol).setValue("Parent Mobile");
    cols.mobile = newCol - 1;
  }
  if (sh.getLastRow() < 2) throw new Error("Students شیٹ میں کوئی طالب علم موجود نہیں۔");
  const data = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getDisplayValues();
  let found = -1;
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][cols.roll]).trim() === roll &&
        String(data[i][cols.className]).trim().toUpperCase() === className.toUpperCase()) {
      found = i + 2; break;
    }
  }
  if (found < 0) throw new Error("اس کلاس میں یہ Roll No نہیں ملا۔");
  sh.getRange(found, cols.name+1).setValue(name);
  sh.getRange(found, cols.father+1).setValue(father);
  sh.getRange(found, cols.mobile+1).setValue(mobile);
  return {message:"طالب علم کی معلومات کامیابی سے اپ ڈیٹ ہوگئیں۔", name, father, mobile};
}

// ---------------- MONTHLY FINE REPORT ----------------
// Fine is calculated from saved attendance records. Re-saving a date replaces that date's
// attendance rows, so the report never double-counts an absence.
function getFineRate_(className) {
  const match = String(className || "").match(/\d+/);
  if (!match) return 0;
  const grade = Number(match[0]);
  if (grade >= 1 && grade <= 8) return 5;
  if (grade === 9 || grade === 10) return 10;
  return 0;
}

function getFinePaymentsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEETS.FINE_PAYMENTS);
  if (!sh) sh = createSheet_(ss, CONFIG.SHEETS.FINE_PAYMENTS,
    ["Payment Date", "Month", "Class", "Roll No", "Student Name", "Amount Paid", "Received By", "Timestamp"]);
  return sh;
}

function fineDateKey_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, "yyyy-MM-dd");
  }
  const v = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (m) return m[3] + "-" + String(m[2]).padStart(2,"0") + "-" + String(m[1]).padStart(2,"0");
  return v;
}

function getMonthlyFineReport(token, className, month) {
  const user = getSession_(token);
  if (user.role !== "TEACHER" && user.role !== "PRINCIPAL") throw new Error("Access denied.");
  className = String(className || "").trim();
  month = String(month || Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM")).trim();
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("ماہ درست منتخب کریں۔");
  if (!className) throw new Error("Class منتخب کریں۔");

  const rate = getFineRate_(className);
  const sh = getSheet_(CONFIG.SHEETS.ATTENDANCE);
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow()-1, 9).getValues() : [];
  const byStudent = {};
  rows.forEach(r => {
    const dateKey = fineDateKey_(r[0]);
    if (!dateKey.startsWith(month + "-") ||
        String(r[1]).trim().toUpperCase() !== className.toUpperCase() ||
        String(r[6]).trim().toLowerCase() !== "absent") return;
    const key = String(r[2] || "").trim();
    if (!key) return;
    if (!byStudent[key]) byStudent[key] = {absentDays:0, dates:[]};
    if (!byStudent[key].dates.includes(dateKey)) {
      byStudent[key].absentDays++;
      byStudent[key].dates.push(dateKey);
    }
  });

  const paymentSheet = getFinePaymentsSheet_();
  const paymentRows = paymentSheet.getLastRow() > 1
    ? paymentSheet.getRange(2,1,paymentSheet.getLastRow()-1,8).getDisplayValues() : [];
  const paidByStudent = {};
  paymentRows.forEach(r => {
    if (String(r[1]).trim() !== month || String(r[2]).trim().toUpperCase() !== className.toUpperCase()) return;
    const roll = String(r[3] || "").trim();
    if (roll) paidByStudent[roll] = (paidByStudent[roll] || 0) + (Number(r[5]) || 0);
  });

  const classStudents = getStudentsData_()
    .filter(s => s.className.toUpperCase() === className.toUpperCase())
    .sort((a,b) => a.roll.localeCompare(b.roll, undefined, {numeric:true}));
  const allStudents = classStudents.map(s => {
    const count = byStudent[s.roll] || {absentDays:0, dates:[]};
    const fine = count.absentDays * rate;
    const finePaid = paidByStudent[s.roll] || 0;
    return {roll:s.roll,name:s.name,father:s.father,mobile:s.mobile,absentDays:count.absentDays,
      rate, fine, finePaid, remainingFine:Math.max(0,fine-finePaid), dates:count.dates};
  });

  // Fine report must contain ONLY students who were marked Absent in this month.
  const students = allStudents.filter(s => s.absentDays > 0 && s.fine > 0);
  const totalAbsentDays = students.reduce((n,s) => n+s.absentDays, 0);
  const totalFine = students.reduce((n,s) => n+s.fine, 0);
  const totalPaid = students.reduce((n,s) => n+s.finePaid, 0);
  return {school:CONFIG.SCHOOL,className,month,rate,totalStudents:classStudents.length,
    studentsWithFine:students.length,totalAbsentDays,totalFine,totalPaid,
    totalRemaining:Math.max(0,totalFine-totalPaid),students};
}

function saveFinePayment(token, className, month, roll, amount) {
  const user = getSession_(token);
  if (!['TEACHER','PRINCIPAL'].includes(user.role)) throw new Error('Access denied.');
  className = String(className || '').trim();
  month = String(month || '').trim();
  roll = String(roll || '').trim();
  amount = Number(amount);
  if (!className || !/^\d{4}-\d{2}$/.test(month) || !roll) throw new Error('Class، Month اور Roll No درست درج کریں۔');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('جمع شدہ رقم صفر سے زیادہ درج کریں۔');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const report = getMonthlyFineReport(token, className, month);
    const student = report.students.find(s => s.roll === roll);
    if (!student) throw new Error('طالب علم نہیں ملا۔');
    if (student.remainingFine <= 0) throw new Error('اس طالب علم کا کوئی بقایا جرمانہ نہیں ہے۔');
    if (amount > student.remainingFine) throw new Error('جمع رقم بقایا جرمانے سے زیادہ نہیں ہو سکتی۔ بقایا: Rs. ' + student.remainingFine);
    const sh = getFinePaymentsSheet_();
    sh.appendRow([today_(),month,className,roll,student.name,amount,user.username,new Date()]);
    SpreadsheetApp.flush();
    return {message:'Fine payment کامیابی سے محفوظ ہوگئی۔', amount, remaining:student.remainingFine-amount};
  } finally {
    lock.releaseLock();
  }
}

// ---------------- PRINCIPAL DASHBOARD ----------------
function getPrincipalDashboard(token, date) {
  const user = getSession_(token);
  if (user.role !== "PRINCIPAL") throw new Error("صرف Principal یہ Dashboard دیکھ سکتا ہے۔");
  date = date || today_();
  const attendance = getSheet_(CONFIG.SHEETS.ATTENDANCE);
  const data = attendance.getLastRow() > 1 ? attendance.getRange(2,1,attendance.getLastRow()-1,9).getDisplayValues() : [];
  const rows = data.filter(r => String(r[0]) === String(date)).map(r => ({
    date:r[0], className:r[1], roll:r[2], name:r[3], father:r[4], mobile:r[5], status:r[6], markedBy:r[7]
  }));
  const students = getStudentsData_();
  const classes = [...new Set(students.map(s => s.className))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const classSummary = classes.map(c => {
    const cr = rows.filter(r => r.className === c);
    return {
      className:c, total:students.filter(s=>s.className===c).length, marked:cr.length,
      present:cr.filter(r=>r.status==="Present").length,
      absent:cr.filter(r=>r.status==="Absent").length,
      leave:cr.filter(r=>r.status==="C/Leave").length
    };
  });
  return {
    date, school:CONFIG.SCHOOL, totalStudents:students.length, totalMarked:rows.length,
    present:rows.filter(r=>r.status==="Present").length,
    absent:rows.filter(r=>r.status==="Absent").length,
    leave:rows.filter(r=>r.status==="C/Leave").length,
    classSummary, absentStudents:rows.filter(r=>r.status==="Absent"||r.status==="C/Leave"), allRecords:rows
  };
}

function getPrincipalClassRecords(token, date, className) {
  const user = getSession_(token);
  if (user.role !== "PRINCIPAL") throw new Error("Access denied.");
  const dashboard = getPrincipalDashboard(token, date);
  return dashboard.allRecords.filter(r => !className || r.className === className);
}


// ---------------- OFFLINE ATTENDANCE SYNC ----------------
// Each locally queued batch has a unique ID. If the browser retries after a timeout,
// this endpoint will not write the same batch twice.
function syncOfflineAttendance(token, batch) {
  const user = getSession_(token);
  if (user.role !== "TEACHER") throw new Error("صرف Teacher حاضری Sync کر سکتا ہے۔");
  if (!batch || !batch.id || !batch.className || !Array.isArray(batch.records) || !batch.records.length) {
    throw new Error("Offline attendance batch نامکمل ہے۔");
  }
  const log = getSheet_(CONFIG.SHEETS.OFFLINE_LOG);
  const last = log.getLastRow();
  if (last > 1) {
    const ids = log.getRange(2, 1, last - 1, 1).getDisplayValues().flat();
    const index = ids.indexOf(String(batch.id));
    if (index >= 0) {
      const saved = log.getRange(index + 2, 5).getDisplayValue();
      try { return JSON.parse(saved); } catch (_) { return {message:"یہ Offline batch پہلے Sync ہو چکا ہے۔", batchId:batch.id}; }
    }
  }
  // saveAttendance replaces the class/date snapshot, so a retry after a network timeout
  // cannot create duplicate attendance rows.
  const result = saveAttendance(token, batch.className, batch.date, batch.records);
  result.message = "Offline حاضری Google Sheet میں Sync ہوگئی۔";
  result.batchId = batch.id;
  log.appendRow([String(batch.id), new Date(), batch.className, batch.date, JSON.stringify(result)]);
  return result;
}
