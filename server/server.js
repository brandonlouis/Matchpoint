const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const app = express();
const cors = require("cors");
app.use(cors());

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
});

// Test connection
app.use(express.json());
app.get("/test", (req, res) => {
  res.json({ message: "Connected!" });
});


app.use(bodyParser.json());

app.post('/deleteUser', async (req, res) => {
    const uid = req.body.id;

    try {
      await admin.auth().deleteUser(uid);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(80, () => {
    console.log(`Server is running on port 80`);
});