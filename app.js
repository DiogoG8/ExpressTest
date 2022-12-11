require("dotenv").config();

const { hashPassword, verifyPassword, verifyToken } = require("./auth");

const express = require("express");

const app = express();

const { validateMovie } = require("./validators.js");


app.use(express.json());

const port = process.env.APP_PORT ?? 5000;
const welcome = (req, res) => {
  res.send("Welcome to my users list");
};

app.get("/", welcome);

const movieHandlers = require("./movieHandlers");
const userHandlers = require("./userHandlers");



//Public Routes
app.post(
  "/api/login",
  userHandlers.getUserByEmailWithPasswordAndPassToNext,
  verifyPassword
);
app.get("/api/movies", movieHandlers.getMovies);
app.get("/api/movies/:id", movieHandlers.getMovieById);
app.get("/api/users/:id", userHandlers.getUsersById);
app.get("/api/users", userHandlers.getUsers);
app.post("/api/users", userHandlers.postUser);

app.use(verifyToken); 

//Protected Routes
app.put("/api/users/:id", userHandlers.updateUser);
app.delete("/api/users/:id", userHandlers.deleteUser);
app.put("/api/movies/:id", validateMovie, movieHandlers.updateMovie);
app.delete("/api/movies/:id", movieHandlers.deleteMovie);
app.post("/api/movies", movieHandlers.postMovie);



app.listen(port, (err) => {
  if (err) {
    console.error("Something bad happened");
  } else {
    console.log(`Server is listening on ${port}`);
  }
});

