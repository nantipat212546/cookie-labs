# **สรุป Cookie Lab 1 ฉบับสมบูรณ์ — ตั้งแต่เริ่มต้นจนถึง Logout**

นี่คือคู่มือทบทวน **Lab 1: Cookies, Sessions, Authentication และ Authorization** ตั้งแต่การสร้างโปรเจกต์ การติดตั้ง Library การเขียนโค้ดทั้ง 3 ไฟล์ การรัน การทดสอบ ไปจนถึงการเพิ่ม Logout

ผมรวบรวมจาก Lab ที่เราเพิ่งทำร่วมกัน โดยจัดให้สามารถ **เริ่มสร้างโปรเจกต์ใหม่จากศูนย์ใน VS Code** ได้ และเพิ่มคำอธิบายที่ควรจำสำหรับข้อสอบ

## **1. ภาพรวมของ Lab**

ระบบที่เราจะสร้างมีความสามารถดังนี้

- Login เป็น Student, Lecturer หรือ Admin
- สร้าง Session เมื่อ Login สำเร็จ
- เก็บ Session ID ใน Cookie ของ Browser
- ตรวจสอบสิทธิ์ก่อนเข้าถึงข้อมูล Admin
- Logout โดยลบ Session และ Cookie

ลำดับการทำงานของระบบ

## **2. เตรียมโปรเจกต์ใน VS Code**

💻 ทำใน Terminal

### **2.1 ตรวจสอบ Node.js**

เปิด VS Code → Terminal → New Terminal แล้วพิมพ์

```

node -v
npm.cmd -v

```

ถ้ามีหมายเลขเวอร์ชันทั้งสองคำสั่ง แสดงว่าพร้อมใช้งาน หากยังไม่รู้จักคำสั่ง ให้ติดตั้ง Node.js LTS จาก [เว็บไซต์ Node.js](https://nodejs.org/en/download?utm_source=chatgpt.com)

### **2.2 สร้างโฟลเดอร์และเข้าไปทำงาน**

```

cd C:\Users\Vivobook\Desktop
mkdir cookie-lab
cd cookie-lab

```

ถ้ามีโฟลเดอร์อยู่แล้ว ไม่ต้องสร้างซ้ำ ให้ใช้

```

cd C:\Users\Vivobook\Desktop\cookie-lab

```

### **2.3 เริ่มต้น Node.js Project**

```

npm.cmd init -y

```

คำสั่งนี้สร้างไฟล์ `package.json` เพื่อเก็บข้อมูลโปรเจกต์และรายการ Dependencies

### **2.4 ติดตั้ง Libraries**

```

npm.cmd install express cors cookie-parser

```

| Library         | หน้าที่                                                       |
| --------------- | ------------------------------------------------------------- |
| `express`       | สร้าง Web Server และ API                                      |
| `cors`          | กำหนดการอนุญาตให้ Frontend เรียก API ข้าม Origin              |
| `cookie-parser` | อ่าน Cookie จาก HTTP Request                                  |
| `crypto`        | สร้าง Session ID แบบสุ่ม เป็น Module ที่มีใน Node.js อยู่แล้ว |

เมื่อสำเร็จจะมี `node_modules`, `package.json` และ `package-lock.json`

## **3. โครงสร้างไฟล์**

💻 ทำใน VS Code

สร้างไฟล์ 3 ไฟล์ภายในโฟลเดอร์ `cookie-lab` โดยคลิกขวาที่โฟลเดอร์ → New File

```
cookie-lab/
│
├── server.js          ← Backend
├── client.js          ← Frontend JavaScript
├── index.html         ← หน้าเว็บ
│
├── package.json
├── package-lock.json
└── node_modules/
```

**สำคัญ:** โค้ดในหัวข้อ 4–6 เป็นโค้ดฉบับเต็ม ให้คัดลอกลงไฟล์ตามชื่อที่ระบุ ไม่ต้องนำโค้ดจากหัวข้ออธิบายไปวางซ้ำ

## **4. ไฟล์ server.js — Backend**

💻 คัดลอกโค้ดทั้งหมดลง `server.js`

โค้ดนี้รวมระบบ Login, Session, ตรวจสอบสิทธิ์ Admin และ Logout ไว้แล้ว

```

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();

// Middleware
app.use(express.json());

app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));

app.use(cookieParser());

// ข้อมูลผู้ใช้จำลอง
const USERS = new Map();

USERS.set("Admin", {
    id: 1,
    username: "Admin",
    role: "Admin"
});

USERS.set("Lecturer", {
    id: 2,
    username: "Lecturer",
    role: "Lecturer"
});

// เก็บ Session บน Server
const SESSIONS = new Map();

// LOGIN
app.post("/login", (req, res) => {
    const user = USERS.get(req.body.username);

    // Login ไม่สำเร็จ
    if (user == null) {
        const oldSessionId = req.cookies.sessionId;

        if (oldSessionId) {
            SESSIONS.delete(oldSessionId);
        }

        res.clearCookie("sessionId", {
            secure: true,
            httpOnly: true,
            sameSite: "none"
        });

        return res.sendStatus(401);
    }

    // Login สำเร็จ
    const oldSessionId = req.cookies.sessionId;

    if (oldSessionId) {
        SESSIONS.delete(oldSessionId);
    }

    const sessionId = crypto.randomUUID();

    SESSIONS.set(sessionId, user);

    res.cookie("sessionId", sessionId, {
        secure: true,
        httpOnly: true,
        sameSite: "none"
    });

    return res.send(`Authed as ${user.username}`);
});

// ADMIN DATA
app.get("/adminData", (req, res) => {
    const sessionId = req.cookies.sessionId;

    const user = SESSIONS.get(sessionId);

    if (user == null) {
        return res.sendStatus(401);
    }

    if (user.role !== "Admin") {
        return res.sendStatus(403);
    }

    return res.send(
        "Authorized: You are viewing restricted administrator controls."
    );
});

// LOGOUT
app.post("/logout", (req, res) => {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
        SESSIONS.delete(sessionId);
    }

    res.clearCookie("sessionId", {
        secure: true,
        httpOnly: true,
        sameSite: "none"
    });

    return res.send("Logged out successfully");
});

// START SERVER
app.listen(3000, () => {
    console.log("Server running on port 3000");
});

```

หมายเหตุ: โค้ดฉบับรวมนี้เพิ่มการลบ Session เดิมเมื่อ Login สำเร็จ เพื่อป้องกัน Session เก่าค้างอยู่ เป็นการปรับปรุงจาก Lab ต้นฉบับที่อัปโหลด ระบบยังเป็นตัวอย่างสำหรับการเรียน ไม่ใช่ระบบ Login ที่พร้อมใช้จริง เพราะยังไม่มีการตรวจ Password และ Session ยังไม่มีวันหมดอายุ

### **อธิบายส่วนสำคัญของ server.js**

**1. Middleware**

```
app.use(express.json());
app.use(cookieParser());
```

`express.json()` ทำให้ใช้ `req.body.username` ได้ ส่วน `cookieParser()` ทำให้ใช้ `req.cookies.sessionId` ได้

**2. USERS และ SESSIONS**

```
const USERS = new Map();
const SESSIONS = new Map();
```

`USERS` เก็บรายชื่อผู้ใช้จำลอง ส่วน `SESSIONS` เก็บข้อมูล Session ที่สร้างหลัง Login

**3. Login**

```
const sessionId = crypto.randomUUID();
SESSIONS.set(sessionId, user);
```

สร้าง Session ID แล้วบันทึกว่าหมายเลขนี้เป็นของผู้ใช้คนใด

**4. Cookie**

```
res.cookie("sessionId", sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "none"
});
```

Server ส่ง Cookie กลับไปยัง Browser ผ่าน HTTP Response

**5. Authorization**

```
if (user.role !== "Admin") {
    return res.sendStatus(403);
}
```

ตรวจว่าผู้ใช้มีสิทธิ์ Admin หรือไม่

**6. Logout**

```
SESSIONS.delete(sessionId);
```

ลบ Session ฝั่ง Server จากนั้น `clearCookie()` สั่งให้ Browser ลบ Cookie

## **5. ไฟล์ index.html — หน้าเว็บ**

💻 คัดลอกโค้ดทั้งหมดลง `index.html`

```

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <title>Cookie Authentication Lab</title>
</head>
<body>

    <h1>Cookie Authentication Lab</h1>

    <button onclick="login('Student')">
        Login Student
    </button>

    <button onclick="login('Lecturer')">
        Login Lecturer
    </button>

    <button onclick="login('Admin')">
        Login Admin
    </button>

    <hr>

    <button onclick="getAdminData()">
        Get Admin Data
    </button>

    <button onclick="logout()">
        Logout
    </button>

    <h3>Server Response:</h3>

    <pre id="result"></pre>

    <script src="client.js"></script>

</body>
</html>

```

### **อธิบาย HTML**

- `onclick="login('Admin')"` เรียกฟังก์ชัน `login()` พร้อมส่งชื่อผู้ใช้
- `onclick="getAdminData()"` เรียก API ที่จำกัดเฉพาะ Admin
- `onclick="logout()"` เรียกฟังก์ชันออกจากระบบ
- `<pre id="result">` ใช้แสดงข้อความตอบกลับจาก Server
- `<script src="client.js">` เชื่อมไฟล์ JavaScript เข้ากับหน้าเว็บ

## **6. ไฟล์ client.js — Frontend JavaScript**

💻 คัดลอกโค้ดทั้งหมดลง `client.js`

```

const API_URL = "http://localhost:3000";

// LOGIN
async function login(username) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "include",

            body: JSON.stringify({ username })
        });

        const data = await response.text();

        document.getElementById("result").textContent =
            `Status: ${response.status}\n${data}`;

    } catch (error) {
        document.getElementById("result").textContent =
            `Error: ${error.message}`;
    }
}

// GET ADMIN DATA
async function getAdminData() {
    try {
        const response = await fetch(`${API_URL}/adminData`, {
            method: "GET",
            credentials: "include"
        });

        const data = await response.text();

        document.getElementById("result").textContent =
            `Status: ${response.status}\n${data}`;

    } catch (error) {
        document.getElementById("result").textContent =
            `Error: ${error.message}`;
    }
}

// LOGOUT
async function logout() {
    try {
        const response = await fetch(`${API_URL}/logout`, {
            method: "POST",
            credentials: "include"
        });

        const data = await response.text();

        document.getElementById("result").textContent =
            `Status: ${response.status}\n${data}`;

    } catch (error) {
        document.getElementById("result").textContent =
            `Error: ${error.message}`;
    }
}

```

### **อธิบายคำสั่ง JavaScript ที่ต้องจำ**

| คำสั่ง                   | หน้าที่                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `fetch()`                | ส่ง HTTP Request ไปยัง API                                                             |
| `method: "POST"`         | ส่งข้อมูลไปยัง Server                                                                  |
| `method: "GET"`          | ขอข้อมูลจาก Server                                                                     |
| `JSON.stringify()`       | แปลง Object เป็น JSON String                                                           |
| `credentials: "include"` | ให้ Browser รวม Credentials เช่น Cookie ใน Request ข้าม Origin ภายใต้เงื่อนไขที่อนุญาต |
| `await response.text()`  | อ่าน Response Body เป็นข้อความ                                                         |
| `response.status`        | อ่าน HTTP Status Code                                                                  |
| `textContent`            | แสดงข้อความบนหน้าเว็บ                                                                  |
| `try...catch`            | จัดการ Error เช่น Network Error                                                        |

## **7. วิธีรัน Lab**

### **7.1 เปิด Backend Server**

💻 Terminal ใน VS Code

```

cd C:\Users\Vivobook\Desktop\cookie-lab
node server.js

```

ผลลัพธ์ที่ควรได้

```
Server running on port 3000
```

**อย่าปิด Terminal นี้** เพราะ Server ต้องทำงานตลอดเวลาที่ทดสอบ

หากแก้โค้ด `server.js` ให้กด `Ctrl + C` แล้วรัน `node server.js` ใหม่

### **7.2 เปิด Frontend**

ใน VS Code ติดตั้ง Extension **Live Server** จากนั้น

1. คลิกขวาที่ `index.html`
2. เลือก Open with Live Server
3. เปิดหน้า `http://127.0.0.1:5500/index.html`

ต้องใช้ Origin ให้ตรงกับค่า `origin` ใน CORS ของ `server.js` ถ้า Live Server เปิดคนละ Port หรือ Host ต้องปรับค่าให้ตรงกัน

## **8. ขั้นตอนทดสอบทั้งหมด**

ลำดับทดสอบที่ควรทำก่อนสอบ

ทำสำเร็จ 0 จาก 8 ขั้นตอน

ล้างเครื่องหมาย

เปิด /adminData โดยยังไม่ Login → 401

Login Student → 401

Login Lecturer → 200

Lecturer เรียก Admin Data → 403

Login Admin → 200

Admin เรียก Admin Data → 200

Logout → 200

เรียก Admin Data หลัง Logout → 401

### **ตาราง HTTP Status Code**

| Code                        | ความหมาย                  | ตัวอย่างใน Lab               |
| --------------------------- | ------------------------- | ---------------------------- |
| `200 OK`                    | สำเร็จ                    | Login Admin, Logout          |
| `401 Unauthorized`          | ยังไม่ผ่าน Authentication | ไม่มี Session, Login Student |
| `403 Forbidden`             | ไม่มีสิทธิ์               | Lecturer เข้า Admin API      |
| `404 Not Found`             | ไม่พบ Endpoint            | เรียก URL ที่ไม่ได้สร้าง     |
| `500 Internal Server Error` | Server เกิดข้อผิดพลาด     | โค้ด Server ทำงานผิดพลาด     |

## **9. ดู Cookie จริงใน Browser**

💻 ทดสอบใน Chrome หรือ Edge

1. Login เป็น Admin
2. กด `F12` เปิด Developer Tools
3. ไปที่แท็บ **Application**
4. เลือก **Storage → Cookies**
5. เลือก `http://localhost:3000` หากมีในรายการ

จะเห็น Cookie ชื่อ `sessionId` เมื่อ Browser ยอมรับ Cookie แล้ว

| Attribute       | ความหมาย                                                         |
| --------------- | ---------------------------------------------------------------- |
| `sessionId`     | ตัวระบุ Session                                                  |
| `HttpOnly`      | JavaScript ฝั่ง Client อ่าน Cookie ผ่าน `document.cookie` ไม่ได้ |
| `Secure`        | ส่งผ่าน HTTPS โดยมีข้อยกเว้นสำหรับ localhost ใน Browser บางกรณี  |
| `SameSite=None` | อนุญาตการใช้ Cookie ในบริบท Cross-Site โดยต้องมี Secure          |

หากต้องการดูการส่ง Cookie จริง ให้เปิดแท็บ **Network** แล้วกด Get Admin Data เลือก Request `/adminData` จากนั้นดู Request Headers ว่ามี `Cookie: sessionId=...` หรือไม่

## **10. คำสั่ง Terminal ทั้งหมดที่ควรจำ**

**ชุดคำสั่งสำหรับทบทวน**

&#x20;คัดลอก

```

node -v
npm.cmd -v

cd C:\Users\Vivobook\Desktop
mkdir cookie-lab
cd cookie-lab

npm.cmd init -y
npm.cmd install express cors cookie-parser

node server.js
  
```

ชุดนี้สำหรับเริ่มโปรเจกต์ใหม่ หากมีโฟลเดอร์และ package.json อยู่แล้ว ไม่ต้องสร้างหรือติดตั้งซ้ำ

คำสั่งแก้ปัญหาที่เราเคยเจอ:

| คำสั่ง                     | ใช้เมื่อ                                                                   |
| -------------------------- | -------------------------------------------------------------------------- |
| `Get-Content .\server.js`  | ต้องการดูโค้ดในไฟล์ผ่าน Terminal                                           |
| `Remove-Item package.json` | ไฟล์ package.json เสียหรือว่างเปล่า และต้องการสร้างใหม่ (ควรสำรองไฟล์ก่อน) |
| `npm.cmd init -y`          | สร้าง package.json ใหม่                                                    |
| `Ctrl + C`                 | หยุด Server                                                                |
| `node server.js`           | เริ่ม Server อีกครั้ง                                                      |

## **11. สรุปความรู้ที่ต้องจำไปสอบ**

**Authentication vs Authorization**

Authentication คือการยืนยันตัวตนว่าเป็นใคร ส่วน Authorization คือการตรวจสอบว่ามีสิทธิ์เข้าถึงทรัพยากรหรือไม่

**Cookie vs Session**

Cookie อยู่ฝั่ง Browser ส่วน Session ใน Lab นี้อยู่ฝั่ง Server โดยใช้ `sessionId` เชื่อมข้อมูลทั้งสองฝั่ง

**Login Flow**

Client ส่ง username → Server ตรวจผู้ใช้ → สร้าง Session → ส่ง Cookie → Browser เก็บ Cookie

**Admin Access Flow**

Browser ส่ง Cookie → Server อ่าน Session ID → ค้นหา User → ตรวจ Role → ตอบ 200, 401 หรือ 403

**Logout Flow**

Browser ส่ง Session Cookie → Server ลบ Session → สั่งลบ Cookie → Session เดิมไม่สามารถใช้เข้าถึงข้อมูลได้

**ข้อจำกัดของ Lab**

Lab นี้ใช้ `Map` เก็บ Session ในหน่วยความจำ เมื่อ Restart Server ข้อมูล Session จะหายไป และระบบไม่มี Password, Session Expiration หรือ Session Store แบบถาวร จึงเหมาะกับการศึกษาแนวคิด ไม่ควรนำไปใช้เป็นระบบ Login จริงโดยตรง

นี่คือเนื้อหาครบตั้งแต่ Step 1–7 ของ Cookie Lab ที่เราเรียนกันครับ โดย **หัวข้อ 4, 5 และ 6 คือโค้ดฉบับเต็มที่ต้องวางใน VS Code** ส่วนหัวข้ออื่นเป็นขั้นตอน คำสั่ง และคำอธิบาย

เมื่อทบทวนจนเข้าใจแล้ว เราจะไป **Lab 2: MVC** ต่อ โดยใช้วิธีเดียวกัน คือสร้างโปรเจกต์ เขียนโค้ดทีละไฟล์ รันทดสอบ และอธิบายว่าทุกบรรทัดทำหน้าที่อะไร
