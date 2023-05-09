const http = require("http");
const express = require("express");
const app = express();
const path = require("path");
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// connecting mongodb atlas
const db = 'mongodb+srv://yogendra:FuEK1BqTMjpqi4NT@cluster0.xyzqx3g.mongodb.net/splitshield?retryWrites=true&w=majority';
mongoose.connect(db, {
  useNewUrlParser: true
  // useCreateIndex: true,
  // useUnifiedTopology: true,
  // useFindAndModify: false
}).then(() => {
  console.log('connected to database');
}).catch(error=>{
  console.log(error);
  console.log("error occured while connecting to database")
})
// Define schema for collection seta
const setaSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  output1: {
    type: String,
    required: true
  }
});

// Define schema for collection setb
const setbSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  output2: {
    type: String,
    required: true
  }
});
// Create models for each collection
const SetA = mongoose.model('seta', setaSchema);
const SetB = mongoose.model('setb', setbSchema);


// }).catch((err) => {
//   console.log(err);
// })

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Route for the home page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// route for secure data page
app.get("/securedata", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "securedata.html"));
});

// to stext page
app.get("/stext", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "stext.html"));
});

// to getData page
app.get("/getData", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "getData.html"));
});

// Route for the blog page
app.get("/blog", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "blog.html"));
});

// Route for the contact us page
app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "contact.html"));
});

// to stext page
app.get("/pending", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pending.html"));
});

//post method
app.post("/stext",  (req, res) => {
  const akey = req.body.key; // access the 'key' field from the form
  const textData = req.body.textData; // access the 'textData' field from the form
  const jsonData = JSON.stringify({akey, textData});
  console.log(jsonData); // the string to be sent to the API
  fetch('http://127.0.0.1:8080/process-string', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body:textData // send the input string as JSON in the request body
  })
    .then(response => response.json()) // convert the response to JSON format
    .then(async data => {
      console.log(data); // this is your JSON data received from the API
      // you can store this JSON data in a variable or use it in any way you want
      let out1 = data.output1;
      let out2 = data.output2;

   
      // Store data in seta collection
    const setAData = {
      key: akey,
      output1: out1
    };
    const setADocument = await SetA.create(setAData);

    // Store data in setb collection
    const setBData = {
      key: akey,
      output2: out2
    };
    const setBDocument = await SetB.create(setBData);
    // res.send('Data received!');
    // res.sendFile(path.join(__dirname, "public", "success.html"));
    res.render('success', { akey });
  })
  .catch(error => {console.error(error)
    res.status(400).render('fail', { error, file: 'stext' });
  
  }); // handle any errors that may occur
});




// to handle /getData post data
app.post("/getData", async (req, res) => {
  const akey = req.body.key;
  let out1;
  let out2;

  try {
    // Find out1 from seta collection
    const setaDoc = await SetA.findOne({ key: akey });
    if (setaDoc) {
      out1 = setaDoc.output1;
      // Use out1 as needed
      console.log('out1:', out1);
    } else {
      console.log('No document found in seta collection with the specified key.');
      res.status(400).render('fail', { error: 'No document found in seta collection with the specified key.', file: 'getData'});
      return;
    }

    // Find out2 from setb collection
    const setbDoc = await SetB.findOne({ key: akey });
    if (setbDoc) {
      out2 = setbDoc.output2;
      // Use out2 as needed
      console.log('out2:', out2);
    } else {
      console.log('No document found in setb collection with the specified key.');
      res.status(400).render('fail', { error: 'No document found in seta collection with the specified key.', file: 'getData'});
      return;
    }
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).render('fail', { error , file: 'getData'});
    return;
  }
 
  const sendingJsonData = JSON.stringify({ input1: out1, input2: out2 });

  try {
    const response = await fetch('http://127.0.0.1:8080/process-two-strings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: sendingJsonData
    });

    if (response.ok) {
      const responseData = await response.text();
      console.log(responseData);
      res.render('fetch', { data: responseData });
    } else {
      console.error('Error occurred:', response.status);
      res.status(400).render('fail', { error: 'Error occurred during API request' , file: 'getData'});
    }
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(400).render('fail', { error , file: 'getData'});
  }
});




const port = 8000;
const hostname = "127.0.0.1";
app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

