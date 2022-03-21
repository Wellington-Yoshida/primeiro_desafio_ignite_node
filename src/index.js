const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(400).json({ error: "User not found." })
  }

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const userExists = users.find(user => user.username === username);

  if (userExists) {
    return response.status(400).json({ error: "User not found." })
  }
  const newUser = {
    id: uuidv4(),
    name: name,
    username: username,
    todos: []
  };
  
  users.push(newUser);
  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;

  const newTodo = {
    id: uuidv4(),
    title: title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return response.status(201).json(user.todos);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  
  if (todoNotExists(user.todos, request.params.id)) {
    return response.status(400).json({ error: "Todo not found." })
  }

  user.todos.forEach(item => {
    if (item.id == request.params.id) {
      item.title = title;
      item.deadline = deadline;
    }
  });

  return response.status(201).json(user.todos);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  if (todoNotExists(user.todos, request.params.id)) {
    return response.status(400).json({ error: "Todo not found." })
  }

  user.todos.forEach(todo => {
    if (todo.id === request.params.id) {
      todo.done = true;
    }
  });

  return response.status(201).json(user.todos);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const todo = user.todos.find(todo => todo.id == request.params.id);

  if (!todo) {
    return response.status(400).json({ error: "Todo not found." })
  }

  const index = user.todos.indexOf(todo);
  user.todos.splice(index, 1);

  return response.status(204).json();
});

function todoNotExists(todos, id) {
  for (let todo of todos) {
    if (todo.id == id) {
      return false;
    }
  }
  return true;
}

module.exports = app;