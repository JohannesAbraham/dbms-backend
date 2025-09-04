const express = require('express');
const app = express();
const port = 3000;
const pool = require('./db');

app.use(express.json());

// Add new user
app.post('/users', async (req, res) => {
  try {
    const { username, password_hash, role } = req.body;
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
      [username, password_hash, role || 'staff']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a user
app.put('/users/:id', async (req, res) => {
  try {
    const { username, role } = req.body;
    const result = await pool.query(
      'UPDATE users SET username=$1, role=$2 WHERE user_id=$3 RETURNING *',
      [username, role, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a user
app.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id=$1', [req.params.id]);
    res.send('User deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});