//Importing all the required modules

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const { format } = require("date-fns");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "/todoApplication.db");

// DB initialization
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDbAndServer();

const validateQuery = (req, res, next) => {
  //   console.log(req.query);
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = req.query;
  let validStatus = true;
  const statusValues = ["TO DO", "IN PROGRESS", "DONE", ""];
  const priorityValues = ["HIGH", "MEDIUM", "LOW", ""];
  const categoryValues = ["WORK", "HOME", "LEARNING", ""];
  if (statusValues.includes(status)) {
    if (priorityValues.includes(priority)) {
      if (categoryValues.includes(category)) {
        next();
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
    }
  } else {
    res.status(400);
    res.send("Invalid Todo Status");
  }
};

//API 1
app.get("/todos/", validateQuery, async (req, res) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
  } = req.query;
  const getFilteredTodos = `
        SELECT 
            * 
        FROM      
            todo
        WHERE 
            status LIKE '%${status}%' AND
            priority LIKE '%${priority}%' AND
            todo LIKE '%${search_q}%' AND
            category LIKE '%${category}%';
    `;
  const dbRes = await db.all(getFilteredTodos);
  res.send(dbRes);
});

//API 2
app.get("/todos/:todoId", async (req, res) => {
  const { todoId } = req.params;
  const getTodoWithId = `
        SELECT 
            * 
        FROM      
            todo
        WHERE 
           id=${todoId};
    `;
  const dbRes = await db.get(getTodoWithId);
  res.send(dbRes);
});

const validateDate = (req, res, next) => {
  let { date } = req.query;
  date = new Date(date);
  console.log(date);
  if (isValid(date) === false) {
    res.status(400);
    res.send("Invalid Due Date");
  } else {
    next();
  }
};

//API 3
//  format(new Date(2014, 1, 11), 'MM/dd/yyyy')
app.get("/agenda/", validateDate, async (req, res) => {
  const { date } = req.query;
  const formatedDate = format(new Date(date), "yyyy-MM-dd");
  //   console.log(formatedDate);
  const getTodoWithDate = `
        SELECT 
            * 
        FROM      
            todo
        WHERE 
           due_date LIKE '%${formatedDate}%';
    `;
  const dbRes = await db.all(getTodoWithDate);
  res.send(dbRes);
});

//API 4

const validatePostValues = (req, res, next) => {
  const { status, priority, search_q, category, dueDate } = req.body;
  let validStatus = true;
  const statusValues = ["TO DO", "IN PROGRESS", "DONE", ""];
  const priorityValues = ["HIGH", "MEDIUM", "LOW", ""];
  const categoryValues = ["WORK", "HOME", "LEARNING", ""];
  date = new Date(dueDate);

  if (statusValues.includes(status)) {
    if (priorityValues.includes(priority)) {
      if (categoryValues.includes(category)) {
        if (isValid(date) === true) {
          next();
        } else {
          res.status(400);
          res.send("Invalid Due Date");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
    }
  } else {
    res.status(400);
    res.send("Invalid Todo Status");
  }
};

app.post("/todos/", validatePostValues, async (req, res) => {
  const { id, todo, priority, status, category, dueDate } = req.body;
  const insertTodoQuery = `
        INSERT INTO 
            todo (id,todo,priority,status,category,due_date)
        VALUES
        (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');
    `;
  const dbRes = await db.run(insertTodoQuery);
  res.send("Todo Successfully Added");
});

//API 5
const validatePutValues = (req, res, next) => {
  const { status = "", priority = "", category = "", dueDate = "" } = req.body;

  const statusValues = ["TO DO", "IN PROGRESS", "DONE", ""];
  const priorityValues = ["HIGH", "MEDIUM", "LOW", ""];
  const categoryValues = ["WORK", "HOME", "LEARNING", ""];
  date = new Date(dueDate);

  if (statusValues.includes(status)) {
    if (priorityValues.includes(priority)) {
      if (categoryValues.includes(category)) {
        if (isValid(date) === true) {
          next();
        } else {
          res.status(400);
          res.send("Invalid Due Date");
        }
      } else {
        res.status(400);
        res.send("Invalid Todo Category");
      }
    } else {
      res.status(400);
      res.send("Invalid Todo Priority");
    }
  } else {
    res.status(400);
    res.send("Invalid Todo Status");
  }
};

app.put("/todos/:todoId/", validatePutValues, async (req, res) => {
  const { todoId } = req.params;
  const previousTodo = `SELECT * FROM todo WHERE id=${todoId};`;
  const prevDbRes = await db.get(previousTodo);
  const {
    todo = prevDbRes.todo,
    priority = prevDbRes.priority,
    status = prevDbRes.status,
    category = prevDbRes.category,
    dueDate = prevDbRes.dueDate,
  } = req.body;
  let updateColumn = null;
  if (priority !== prevDbRes.priority) {
    updateColumn = "Priority";
  } else if (todo !== prevDbRes.todo) {
    updateColumn = "Todo";
  } else if (status !== prevDbRes.status) {
    updateColumn = "Status";
  } else if (category !== prevDbRes.category) {
    updateColumn = "Category";
  } else {
    updateColumn = "Due Date";
  }
  const updateTodoQuery = `
        UPDATE todo
        SET
        todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',
        due_date='${dueDate}'
        WHERE id=${todoId};
    `;

  const dbRes = await db.run(updateTodoQuery);
  res.send(`${updateColumn} Updated`);
});

//API 6

app.delete("/todos/:todoId/", async (req, res) => {
  const { todoId } = req.params;
  const deleteTodoQuery = `
        DELETE FROM todo WHERE id=${todoId};
    `;
  const dbRes = await db.run(deleteTodoQuery);
  res.send("Todo Deleted");
});

module.exports = app;
