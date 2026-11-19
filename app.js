
import "dotenv/config";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const port = process.env.PORT || 7000;

const mongoUrl = process.env.MONGODB_URI;
const databaseName = "library_db";

// MongoDB connection
const client = new MongoClient(mongoUrl);

let db;

try {
  await client.connect();
  db = client.db(databaseName);
  console.log("Connected to MongoDB");
} catch (err) {
  console.error("Failed to connect to MongoDB:", err);
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a new book
app.post("/api/v1/books", async (req, res) => {
  try {
    const { title, author, category, price } = req.body;

    if (
      !title ||
      !author ||
      !category ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        message: "All book fields are required",
      });
    }

    const book = {
      title,
      author,
      category,
      price,
    };

    const result = await db.collection("books").insertOne(book);

    res.status(201).json({
      message: "Book created successfully",
      data: {
        _id: result.insertedId,
        ...book,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all books or filter by category
app.get("/api/v1/books", async (req, res) => {
  try {
    const category = req.query.category;
    const query = category ? { category } : {};

    const books = await db.collection("books").find(query).toArray();

    res.status(200).json({
      message: "Books fetched successfully",
      data: books,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single book by ID
app.get("/api/v1/books/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const book = await db.collection("books").findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book fetched successfully",
      data: book,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a book by ID
app.put("/api/v1/books/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const { title, author, category, price } = req.body;

    if (
      !title ||
      !author ||
      !category ||
      price === undefined ||
      price === null ||
      price === ""
    ) {
      return res.status(400).json({
        message: "All book fields are required",
      });
    }

    const book = {
      title,
      author,
      category,
      price,
    };

    const result = await db.collection("books").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: book }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book updated successfully",
      data: {
        _id: req.params.id,
        ...book,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a book by ID
app.delete("/api/v1/books/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const result = await db.collection("books").deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    message: "Not Found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
