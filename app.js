
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config';

const app = express();

// Middleware
app.use(express.json());

// Environment variables
const PORT = process.env.PORT || 7000;
const mongoUrl = process.env.MONGODB_URI;

// MongoDB configuration
if (!mongoUrl) {
    throw new Error('MONGODB_URI is missing. Check your environment variables.');
}

const client = new MongoClient(mongoUrl);

let db;
let booksCollection;

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();

        db = client.db('library_db');
        booksCollection = db.collection('books');

        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}

// Home route
app.get('/', (req, res) => {
    res.json({
        message: 'Books API is running successfully'
    });
});

// CREATE - Add a new book
app.post('/api/v1/books', async (req, res) => {
    try {
        const book = {
            ...req.body,
            createdAt: new Date()
        };

        delete book._id;

        const result = await booksCollection.insertOne(book);

        res.status(201).json({
            message: 'Book added successfully',
            data: {
                _id: result.insertedId,
                ...book
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error adding book',
            error: error.message
        });
    }
});

// READ - Get all books
app.get('/api/v1/books', async (req, res) => {
    try {
        const { category } = req.query;

        const filter = category ? { category } : {};

        const books = await booksCollection.find(filter).toArray();

        res.status(200).json({
            message: 'Books fetched successfully',
            data: books
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error fetching books',
            error: error.message
        });
    }
});

// READ - Get a single book by ID
app.get('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid book ID'
            });
        }

        const book = await booksCollection.findOne({
            _id: new ObjectId(id)
        });

        if (!book) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        res.status(200).json({
            message: 'Book fetched successfully',
            data: book
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error fetching book',
            error: error.message
        });
    }
});

// UPDATE - Update a book by ID
app.put('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid book ID'
            });
        }

        const updateData = { ...req.body };

        delete updateData._id;
        delete updateData.createdAt;

        const result = await booksCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        res.status(200).json({
            message: 'Book updated successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error updating book',
            error: error.message
        });
    }
});

// DELETE - Delete a book by ID
app.delete('/api/v1/books/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: 'Invalid book ID'
            });
        }

        const result = await booksCollection.deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: 'Book not found'
            });
        }

        res.status(200).json({
            message: 'Book deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error deleting book',
            error: error.message
        });
    }
});

// Start application
connectDB();
