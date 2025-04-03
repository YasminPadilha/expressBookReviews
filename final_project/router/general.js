const express = require("express");
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  // Check if username or password is missing
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  // Check if the username already exists
  const userExists = users.some((user) => user.username === username);
  if (userExists) {
    return res
      .status(409)
      .json({ message: "Username already exists. Please choose another." });
  }

  // Register the new user
  users.push({ username, password });

  return res.status(201).json({ message: "User registered successfully!" });
});

// Get the book list available in the shop
public_users.get("/", async (req, res) => {
  try {
    return res.status(200).json({ books: books });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching books", error });
  }
});

function generateISBN(id) {
  // Generate your own ISBN logic.
  return `978-3-${id}-000-${id}-X`;
}

// Get book details based on ISBN using async/await
public_users.get("/isbn/:isbn", async (req, res) => {
  const isbn = req.params.isbn; // Extract ISBN from the URL

  try {
    console.log(`Searching for book with ISBN: ${isbn}`);

    // Simulating an asynchronous operation to check the book list
    const bookDetails = await getBookByISBN(isbn);

    if (bookDetails) {
      return res.status(200).json(bookDetails); // Return the book details if found
    } else {
      return res.status(404).json({ message: "Book Not Found" }); // If no book is found
    }
  } catch (error) {
    // Enhanced error handling
    console.error("Error fetching book details:", error);
    return res.status(500).json({
      message: "Error fetching book details",
      error: error.message || error, // Sending the actual error message
    });
  }
});

// Simulated async function to search for book details based on ISBN
async function getBookByISBN(isbn) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Loop through books and compare ISBNs
        for (let id in books) {
          const generatedISBN = generateISBN(id);

          // If ISBN matches the generated ISBN, return book
          if (generatedISBN === isbn) {
            return resolve(books[id]);
          }
        }

        // If no matching book found
        resolve(null);
      } catch (error) {
        reject(new Error("Error during ISBN lookup: " + error.message));
      }
    }, 100); // Simulating a small delay
  });
}

// Get book details based on author using async/await
public_users.get("/author/:author", async (req, res) => {
  const author = req.params.author.toLocaleLowerCase(); // Extract author from URL
  let booksByAuthor = []; // Initialize an empty array to store matching books

  try {
    const bookIds = Object.keys(books); // Get all book IDs

    // Loop through the books to find matching author
    for (let id of bookIds) {
      const book = books[id];

      // If the book has an author and it matches the request, add it to the result array
      if (book && book.author && book.author.toLowerCase() === author) {
        booksByAuthor.push(book);
      }
    }

    // If books by this author are found, send them in response
    if (booksByAuthor.length > 0) {
      return res.status(200).json(booksByAuthor);
    } else {
      // If no books by this author are found, send a 404 response
      return res
        .status(404)
        .json({ message: "No books found for this author" });
    }
  } catch (error) {
    // Handle any errors that may occur during processing
    console.error("Error fetching books:", error);
    return res
      .status(500)
      .json({ message: "Error fetching books by author", error });
  }
});
// Get all books based on title using async/await
public_users.get("/title/:title", async (req, res) => {
  const title = req.params.title.toLocaleLowerCase(); // Extract title from URL
  let booksByTitle = []; // Initialize an empty array to store matching books

  try {
    const bookIds = Object.keys(books); // Get all book IDs

    // Loop through the books to find matching title
    for (let id of bookIds) {
      const book = books[id];

      // If the book has a title and it matches the request, add it to the result array
      if (book && book.title && book.title.toLocaleLowerCase() === title) {
        booksByTitle.push(book);
      }
    }

    // If books with the title are found, send them in response
    if (booksByTitle.length > 0) {
      return res.status(200).json(booksByTitle);
    } else {
      // If no books with the title are found, send a 404 response
      return res.status(404).json({ message: "No books found for this title" });
    }
  } catch (error) {
    // Handle any errors that may occur during processing
    console.error("Error fetching books:", error);
    return res
      .status(500)
      .json({ message: "Error fetching books by title", error });
  }
});

//  Get book review
public_users.get("/review/:isbn", function (req, res) {
  const isbn = req.params.isbn;
  let bookFound = false;
  let reviews = [];

  for (let id in books) {
    const generatedISBN = generateISBN(id);

    if (generatedISBN === isbn) {
      bookFound = true;
      const book = books[id]; // Get the book details
      reviews = book.reviews || []; // Get the reviews if available (empty array if no reviews)
      break; // Exit the loop once the book is found
    }
  }
  // If the book is found, return the reviews
  if (bookFound) {
    return res.status(200).json({ reviews: reviews });
  } else {
    // If the book is not found, return a "Book Not Found" message
    return res
      .status(404)
      .json({ message: "Book not found or no reviews available" });
  }
});

module.exports.general = public_users;
