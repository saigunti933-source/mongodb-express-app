
import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = 7000;

// MongoDB connection
const mongoUrl = "mongodb://admin:admin123@localhost:27017";
const databaseName = "library_db";

const client = new MongoClient(mongoUrl);

let db;
await client
  .connect()
  .then(() => {
    db = client.db(databaseName);
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a new book
app.post("/api/v1/books", (req, res) => {
  const { title, author, category, price } = req.body;

  if (!title || !author || !category || !price) {
    return res.status(400).json({
      message: "All book fields are required"
    });
  }

  db.collection("books")
    .insertOne({ title, author, category, price })
    .then((result) => {
      const newBook = {
        _id: result.insertedId,
        title,
        author,
        category,
        price,
      };

      res.status(201).json({
        message: "Book created successfully",
        data: newBook,
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Get all books or filter by category
app.get("/api/v1/books", (req, res) => {
  const category = req.query.category;
  const query = category ? { category } : {};

  db.collection("books")
    .find(query)
    .toArray()
    .then((books) => {
      res.status(200).json({
        message: "Books fetched successfully",
        data: books,
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Get a single book by ID
app.get("/api/v1/books/:id", (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  db.collection("books")
    .findOne({ _id: new ObjectId(req.params.id) })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.status(200).json({
        message: "Book fetched successfully",
        data: book,
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Update a book by ID
app.put("/api/v1/books/:id", (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  const { title, author, category, price } = req.body;

  if (!title || !author || !category || !price) {
    return res.status(400).json({
      message: "All book fields are required"
    });
  }

  const book = { title, author, category, price };

  db.collection("books")
    .updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: book }
    )
    .then((result) => {
      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.status(200).json({
        message: "Book updated successfully",
        data: { _id: req.params.id, ...book },
      });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Delete a book by ID
app.delete("/api/v1/books/:id", (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid book ID" });
  }

  db.collection("books")
    .deleteOne({ _id: new ObjectId(req.params.id) })
    .then((result) => {
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.status(200).json({ message: "Book deleted successfully" });
    })
    .catch((err) => res.status(500).json({ message: err.message }));
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
