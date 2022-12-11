const database = require("./database");
const argon2 = require("argon2");


const getUsers = (req, res) => {
  const initialSql = "select * from users";
  const where = [];

  if (req.query.language != null) {
    where.push({
      column: "language",
      value: req.query.language,
      operator: "=",
    });
  }
  if (req.query.city != null) {
    where.push({
      column: "city",
      value: req.query.city,
      operator: "=",
    });
  }


  database
    .query(
      where.reduce(
        (sql, { column, operator }, index) =>
          `${sql} ${index === 0 ? "where" : "and"} ${column} ${operator} ?`,
        initialSql
      ),
      where.map(({ value }) => value)
    )
    .then(([users]) => {
      res.json(users);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500).send("Error retrieving data from database");
    });
  };


const getUsersById = (req, res) => {
  const id = parseInt(req.params.id);

  database
    .query("select id, firstname, lastname, email, city, language from users where id = ?", [id])
    .then(([users]) => {
      if (users[0] != null) {
        res.status(200).json(users[0]);
      } else {
        res.status(404).send("Not Found");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving data from database");
    });
};

const postUser = (req, res, next) => {
  
  const hashingOptions = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 5,
    parallelism: 1,
  };
  const { id, firstname, lastname, email, city, language, hashedPassword} = req.body;

  argon2
  .hash(req.body.password, hashingOptions)
  .then((hashedPassword) => {
    console.log(hashedPassword);

    req.body.hashedPassword = hashedPassword;
    delete req.body.password;


    database
    .query(
      "INSERT INTO users(id, firstname, lastname, email, city, language, hashedPassword) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, firstname, lastname, email, city, language, hashedPassword]
    )
    .then(([result]) => {
      res.location(`/api/users/${result.insertId}`).sendStatus(201);
      next()
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error saving the user");
    });
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });

};


const updateUser = (req, res) => {
  const id = parseInt(req.params.id);
  const {firstname, lastname, email, language } = req.body;

  database
    .query(
      "update users set firstname = ?, lastname= ?, email = ?, language = ? where id = ?",
      [firstname, lastname, email, language, id]
    )
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.status(404).send("Not Found");
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error editing the user");
    });
};

const deleteUser = (req, res) => {
  const id = parseInt(req.params.id);

  database
    .query("delete from users where id = ?", [id])
    .then(([result]) => {
      if (result.affectedRows === 0) {
        res.status(404).send("Not Found");
      } else {
        res.sendStatus(204);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error deleting the user");
    });
};



const getUserByEmailWithPasswordAndPassToNext = (req, res, next) => {
  const { email } = req.body;

  database
    .query("select * from users where email = ?", [email])
    .then(([users]) => {
      if (users[0] != null) {
        req.user = users[0];

        next();
      } else {
        res.sendStatus(401);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error retrieving data from database");
    });
};


module.exports = {
  getUsers,
  getUsersById,
  postUser,
  updateUser,
  deleteUser,
  getUserByEmailWithPasswordAndPassToNext
};