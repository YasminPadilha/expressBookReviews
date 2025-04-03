const express = require("express");
const jwt = require("jsonwebtoken");
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [
  {
    id: 1,
    username: "John",
    password: "password123", // Password in plaintext for testing purposes
  },
];

const verifyToken = (req, res, next) => {
  // Step 1: Get token from the Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No Token Provided." });
  }

  try {
    // Step 2: Verify the token and extract the user info
    const decoded = jwt.verify(token, "your_secret_key"); // Secret key for token verification
    req.user = decoded; // Save user info (username) in the request object
    next(); // Proceed to the next route handler
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid token. Please log in again." });
  }
};

const isValid = (username) => {
  return users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  const user = users.find((user) => user.username === username);
  return user && user.password === password; // Simple plaintext comparison (for testing only)
};

//only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Check if username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Please provide both username and password." });
  }

  // Find the user by username
  const user = users.find((u) => u.username === username);
  console.log("User found:", user);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  // Compare passwords (plaintext comparison for testing)
  if (user.password !== password) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  // Generate JWT token
  const accessToken = jwt.sign({ username: user.username }, "your_secret_key");
  return res.json({ message: "Login successful.", accessToken });
});

// Add a book review
regd_users.put("/review/:isbn", verifyToken, (req, res) => {
  console.log("Received request body:", req.body);
  const username = req.user.username;
  const isbn = req.params.isbn;
  const newReview = req.body.review;

  if (!newReview) {
    console.log("Error: Review is missing.");
    return res.status(400).json({ message: "Please provide a review" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  // Ensure reviews exist as an array
  if (!Array.isArray(books[isbn].reviews)) {
    books[isbn].reviews = [];
  }

  // Find the existing review
  let reviewIndex = books[isbn].reviews.findIndex(
    (r) => r.reviewer === username
  );

  if (reviewIndex !== -1) {
    // Update existing review
    books[isbn].reviews[reviewIndex].comment = newReview;
    console.log("Review updated successfully.");
    return res.json({ message: "Review updated successfully" });
  } else {
    // Add new review if not found
    books[isbn].reviews.push({ reviewer: username, comment: newReview });
    console.log("New review added.");
    return res.json({ message: "Review added successfully" });
  }
});

regd_users.delete("/review/:isbn", verifyToken, (req, res) => {
  console.log("DELETE request received!");
  const username = req.user.username;
  const isbn = req.params.isbn;

  if (!books[isbn]) {
    console.log("Book not found.");
    return res.status(404).json({ message: "Book not found" });
  }

  console.log("Book found:", books[isbn]);

  // Ensure reviews exist and are stored as an array
  if (!Array.isArray(books[isbn].reviews) || books[isbn].reviews.length === 0) {
    console.log("No reviews found for this book.");
    return res.status(404).json({ message: "No reviews found for this book." });
  }

  // Filter out the review from the array
  let initialLength = books[isbn].reviews.length;
  books[isbn].reviews = books[isbn].reviews.filter(
    (review) => review.reviewer !== username
  );

  // If no reviews were removed, return an error
  if (books[isbn].reviews.length === initialLength) {
    console.log("User's review not found.");
    return res
      .status(404)
      .json({
        message: "Review not found or you don't have permission to delete it",
      });
  }

  console.log("Review deleted successfully.");
  return res.json({ message: "Your review has been deleted successfully" });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
