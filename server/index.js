const express = require("express"); // express require from package
const cors = require("cors"); // cors require from package
const app = express(); // create app instance
const jwtToken = require("jsonwebtoken");
app.use(express.json()); // for parsing application/json
app.use(
  cors({
    origin: ["http://localhost:5173"], //client or front end url base url
  })
);
const port = 2000; /// server running port
const mongoose = require("mongoose"); // mongoose require from package
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  admissionYear: {
    type: Number,
    required: true,
    min: 1000,
  },
  profilePic: {
    type: String,
  },

});
const User = mongoose.model("User", userSchema);
module.exports = User;
// verify cookie
const verifyMyCookie = (req, res, next) => {
  const myCookie = req.query.myCookie;
  if (!myCookie) {
    return res.status(401).json({
      message: "Unauthorized user",
    });
  }
  jwtToken.verify(myCookie, "SECRET_KEY", (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    req.userid = decoded.userId;
    next();
  });
};
app.post("/signup", async (req, res) => {
  const { password, name, email,phone,branch,admissionYear ,profilePic } = req.body;
  if (!password || !name || !email||!phone ||!branch || !admissionYear) {
    return res.status(400).json({
      error: "ALL FIELDS ARE REQUIRED",
    });
  }
  try {
    // email unique
    const ifAccountAlready = await User.findOne({
      email,
    });
    if (ifAccountAlready) {
      return res.status(400).json({
        error: "EMAIL ALREADY EXISTS,Please LOGIN",
      });
    }
    const newUser = new User({
      name: name,
      email: email,
      password: password,
      phone: phone,
      branch: branch,
      admissionYear: admissionYear,
      profilePic: profilePic,
    });
    await newUser.save();
    return res.status(201).json({
      message: "Your Account Created Successfully,Please LOGIN",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});
app.post("/login", async (req, res) => {
  const { password, email } = req.body;
  if (!password || !email) {
    return res.status(400).json({
      error: "ALL FIELDS ARE REQUIRED",
    });
  }
  try {
    // account already
    const ifAccountAlready = await User.findOne({
      email,
    });
    if (!ifAccountAlready) {
      return res.status(400).json({
        error: "Your Account Not Found",
      });
    }
    if (ifAccountAlready.password !== password) {
      return res.status(400).json({
        error: "Incorrect Password",
      });
    }
    const cookie = jwtToken.sign(
      { userId: ifAccountAlready._id },
      "SECRET_KEY",
      {
        expiresIn: "2d",
      }
    );
    return res.status(200).json({
      message: "Login Successfully",
      cookie,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});
app.get("/profile-details", verifyMyCookie, async (req, res) => {
  const userId = req.userid;
  try {
    const myData = await User.findById(userId);
    if (!myData) {
      return res.status(400).json({
        error: "Your Account Not Found",
      });
    }
    return res.status(200).json({
      message: "Profile Details",
      name: myData.name,
      email: myData.email,
      phone: myData.phone,  
      address: myData.address,          // Additional field
      age: myData.age,                  // Additional field
      branch: myData.branch,            
      admissionYear: myData.admissionYear,
      profilePic: myData.profilePic, 
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});
app.put("/update-profile", verifyMyCookie, async (req, res) => {
    const { email, name, phone, branch, admissionYear ,profilePic} = req.body;
  if (!email || !name) {
    return res.status(400).json({
      error: "ALL FIELDS ARE REQUIRED",
    });
  }
  const userId = req.userid;
  try {
    const isAccountExist = await User.findById(userId);
    if (!isAccountExist) {
      return res.status(400).json({
        error: "Your Account Not Found",
      });
    }
    isAccountExist.name = name;
    isAccountExist.email = email;
    isAccountExist.phone = phone;
    isAccountExist.branch= branch;
    isAccountExist.admissionYear =admissionYear;
    isAccountExist.profilePic = profilePic;
    await isAccountExist.save();
    return res.status(200).json({
      message: "Profile Updated Successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
});
const databaseConnection = async () => {
  return await mongoose.connect("mongodb://127.0.0.1:27017/libraryMangament");
};
app.get("/api", (req, res) => {
  return res.status(200).json({
    message: "Hello World",
  });
});
app.listen(port, () => {
  console.log("My First Server is Listening on port " + port);
});
databaseConnection()
  .then(() => {
    console.log("Database Connected");
  })
  .catch((error) => {
    console.log("error while connecting database", error);
  });