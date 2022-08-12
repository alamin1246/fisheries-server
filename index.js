const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb");

const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jxvhauk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();
    console.log("Database Connected");

    const UserCollections = client.db("user").collection("Users");
    const EmployeeCollections = client.db("Employee").collection("information");
    const AdminCollections = client.db("Author").collection("Information");
    const ReviewsCollection = client.db("Reviews").collection("Review");
    const TaskCollection = client.db("Tasks").collection("Task");
    const AttendanceCollection = client
      .db("Attendances")
      .collection("Attendance");

    app.post("/employee-login", async (req, res) => {
      const ID = req.body.employeeID;
      const password = req.body.password;

      const IdMatch = await EmployeeCollections.findOne({
        employeeID: ID,
      });
      const passMatch = await EmployeeCollections.findOne({
        employeePassword: password,
      });
      if (IdMatch && passMatch) {
        return res.send(IdMatch);
      } else if (!IdMatch) {
        return res.send({
          error: "আপনার তথ্য সঠিক নয়। লগিন করতে ব্যর্থ হয়েছে!",
        });
      } else if (!passMatch) {
        return res.send({
          error: "আপনার দেওয়া পাসওয়ার্ডটি সঠিক নয়। পূনারায় চেষ্টা করুন।",
        });
      } else {
        return res.send({ error: "Admin Info Not Matching!" });
      }
    });
    app.post("/admin-login", async (req, res) => {
      const ID = req.body.employeeID;
      const password = req.body.password;

      const IdMatch = await AdminCollections.findOne({
        employeeID: ID,
      });
      const passMatch = await AdminCollections.findOne({
        employeePassword: password,
      });
      if (IdMatch && passMatch) {
        return res.send(IdMatch);
      } else if (!IdMatch) {
        return res.send({
          error: "আপনার তথ্য সঠিক নয়। লগিন করতে ব্যর্থ হয়েছে!",
        });
      } else if (!passMatch) {
        return res.send({
          error: "আপনার দেওয়া পাসওয়ার্ডটি সঠিক নয়। পূনারায় চেষ্টা করুন।",
        });
      } else {
        return res.send({ error: "Admin Info Not Matching!" });
      }
    });

    /* Admin section
        1. get admin
        2. put admin
        
        */

    // get  admin

    app.get("/admin/:employeeID", async (req, res) => {
      const employeeID = req.params.employeeID;

      const admin = await AdminCollections.findOne({
        employeeID: employeeID,
      });
      const isAdmin = admin?.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.get("/my-profile", async (req, res) => {
      const email = req.query.email;

      try {
        const qurey = { email: email };
        const orders = await AdminCollections.find(qurey).toArray();
        res.send(orders);
      } catch (error) {
        return res.send({ message: "Data not found" });
      }
    });
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await UserCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "30d" }
      );
      res.send({ result, token });
    });

    app.get("/rivews", async (req, res) => {
      const qurey = {};
      const cursor = ReviewsCollection.find(qurey);
      const rivew = await cursor.toArray();
      res.send(rivew);
    });
    app.post("/rivews", async (req, res) => {
      const rivew = req.body;
      const result = await ReviewsCollection.insertOne(rivew);
      res.send({ success: true, result });
    });

    //    task route
    app.get("/task", async (req, res) => {
      const qurey = {};
      const cursor = TaskCollection.find(qurey);
      const tasks = await cursor.toArray();
      res.send(tasks);
    });
    app.post("/task", async (req, res) => {
      const Task = req.body;
      const result = await TaskCollection.insertOne(Task);
      res.send({ success: true, result });
    });

    app.get("/all-tasks/:formattedDate", async (req, res) => {
      const date = req.params.formattedDate;
      const query = { date: date };
      const data = TaskCollection.find(query);
      const result = await data.toArray();
      if (result.length > 0) {
        res.status(200).send(result);
      } else {
        res.status(200).send({
          error: "Your Selected Data Have No Task",
        });
      }
    });

    app.get("/assigned-tasks/:employeeID", async (req, res) => {
      const employeeID = req.params.employeeID;
      const query = { employeeID: employeeID };
      const data = TaskCollection.find(query);
      const result = (await data.toArray()).reverse();

      if (result.length > 0) {
        res.status(200).send(result);
      } else {
        res.status(200).send({
          error: "Your Selected Data Have No Task",
        });
      }
    });
    app.patch("/task-update/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const filter = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            completed: "completed",
          },
        };
        const result = await TaskCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        console.log(result);

        res.send({ success: true, result });
      } catch (error) {
        return res.send({ error: "Data not found" });
      }
    });

    /* Employee Route 
        1. get Employee
        2.post Employee
        3.delete Employee
        */
    // 1. get Employee
    app.get("/employee", async (req, res) => {
      const qurey = {};
      const cursor = EmployeeCollections.find(qurey);
      const alOrders = await cursor.toArray();
      res.send(alOrders);
    });

    // 2.post Employee
    app.put("/employee", async (req, res) => {
      const employeeData = req.body;

      const result = await EmployeeCollections.insertOne(employeeData);
      res.send(result);
    });
    // 3.delete Employee
    app.delete("/employee/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const filter = { _id: ObjectId(id) };
        const result = await EmployeeCollections.deleteOne(filter);
        res.send(result);
      } catch (error) {
        res.status(204).send({ error: "something went wrong" });
      }
    });

    // Attendance
    app.get("/attendance/:formattedDate", async (req, res) => {
      const date = req.params.formattedDate;
      const query = { date: date };
      const result = await AttendanceCollection.find(query).toArray();

      if (result.length > 0) {
        res.status(200).send(result);
      } else {
        res.status(200).send({
          error: "Your Selected Data Have No Attendance",
        });
      }
    });
    // put attendance
    app.put("/attendance/:id", async (req, res) => {
      const id = req.params.id;
      const date = req.body.date;
      const query = { _id: ObjectId(id) };
      const attendance = req.body;
      console.log(attendance);
      console.log(typeof date);
      try {
        const data = await EmployeeCollections.findOneAndUpdate(query, {
          $push: {
            attendances: date,
          },
        });
        const result = await AttendanceCollection.insertOne(attendance);
        return res.status(200).send(data);
      } catch (error) {
        res.status(204).send({ error: "something went wrong" });
      }
    });
  } finally {
  }
};
run().catch(console.dir);
app.get("/", (reqest, res) => {
  res.status(200).send("I'm listening from Fisheries Management System");
});

app.listen(port, () => {
  console.log("Listening on port", port);
});
