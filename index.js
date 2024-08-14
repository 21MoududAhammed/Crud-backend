const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("This is backend server for crud operation.");
});

const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const booksCollection = client.db("booksDB").collection("books");

    // POST or insert a book's details
    app.post("/books", async (req, res) => {
      try {
        const bookDetails = req.body;
        const result = await booksCollection.insertOne(bookDetails);
        res.status(201).send(result); // Respond with 201 status code for creation
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to add book",
          error: error.message,
        });
      }
    });

    // GET all book details
    app.get("/books", async (req, res) => {
      try {
        const cursor = booksCollection.find();
        const result = await cursor.toArray();
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch books",
          error: error.message,
        });
      }
    });

    // GET a book's details by ID
    app.get("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await booksCollection.findOne(query);

        if (result) {
          res.status(200).send(result);
        } else {
          res.status(404).send({ success: false, message: "Book not found" });
        }
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to fetch the book",
          error: error.message,
        });
      }
    });

    // PUT or update a book's details
    app.put("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const bookDetails = req.body;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updatedBookDetails = {
          $set: { ...bookDetails },
        };

        const result = await booksCollection.updateOne(
          filter,
          updatedBookDetails,
          options
        );

        if (result.modifiedCount > 0) {
          res.send({
            success: true,
            message: "Book updated successfully",
            result,
          });
        } else if (result.upsertedCount > 0) {
          res.send({
            success: true,
            message: "Book not found, but a new book was created",
            result,
          });
        } else {
          res.status(404).send({ success: false, message: "Book not found" });
        }
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to update the book",
          error: error.message,
        });
      }
    });

    // DELETE a book by ID
    app.delete("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await booksCollection.deleteOne(query);

        if (result.deletedCount > 0) {
          res.send({
            success: true,
            message: "Book deleted successfully",
          });
        } else {
          res.status(404).send({ success: false, message: "Book not found" });
        }
      } catch (error) {
        res.status(500).send({
          success: false,
          message: "Failed to delete the book",
          error: error.message,
        });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port, ${port}`);
});
