const express = require("express");
const app = express();

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const bcrypt = require("bcrypt");
app.use(express.json());
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Register API
//API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const selectUserQuery = `
            SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  const passwordLength = password.length;
  if (passwordLength < 5) {
    response.status(400);
    response.send("Password is too short");
  } else if (dbUser === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const getRegisterQuery = `
            INSERT INTO user(username,name,password,gender,location)
            VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    await db.run(getRegisterQuery);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
//login API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
//change Password API
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUserQuery = `
            SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery);
  const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (isValidPassword === true) {
    const lengthOfPassword = newPassword.length;
    if (lengthOfPassword < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const encryptedPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `
                UPDATE user 
                SET password='${encryptedPassword}'
                WHERE username='${username}';`;
      await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
