
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://127.0.0.1:5500",
  credentials: true
}));
app.use(cookieParser());

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

const SESSIONS = new Map();

app.post("/login", (req, res) => {
  const user = USERS.get(req.body.username);

  if (user == null) {
    SESSIONS.delete(req.cookies.sessionId);
    res.clearCookie("sessionId", {
      secure: true,
      httpOnly: true,
      sameSite: "none"
    });
    return res.sendStatus(401);
  }

  const sessionId = crypto.randomUUID();
  SESSIONS.set(sessionId, user);

  res.cookie("sessionId", sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "none"
  });

  res.send(`Authed as ${req.body.username}`);
});

app.get("/adminData", (req, res) => {
  const user = SESSIONS.get(req.cookies.sessionId);

  if (user == null) {
    return res.sendStatus(401);
  }

  if (user.role !== "Admin") {
    return res.sendStatus(403);
  }

  res.send(
    "Authorized: You are viewing restricted administrator controls."
  );
});


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


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
