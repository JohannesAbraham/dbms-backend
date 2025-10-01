const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const pool = require('./db');

app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

function buildUpdateQuery(table, idField, idValue, fields) {
  const keys = Object.keys(fields);
  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
  const values = Object.values(fields);
  return {
    text: `UPDATE ${table} SET ${setClause} WHERE ${idField} = $${keys.length + 1} RETURNING *`,
    values: [...values, idValue],
  };
}

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY user_id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Add new user
app.post('/users', async (req, res) => {
  try {
    const { username, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
      [username, hashedPassword,'staff']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  try {
    const { username, password } = req.body;
    const { id } = req.params;

    // Fetch the existing user
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    // If password is provided, hash it, otherwise keep old one
    let hashedPassword = existingUser.rows[0].password_hash;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update username + password_hash
    const result = await pool.query(
      `UPDATE users
       SET username = $1, password_hash = $2
       WHERE user_id = $3
       RETURNING *`,
      [username || existingUser.rows[0].username, hashedPassword, id]
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

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY product_id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Add a product
app.post('/products', async (req, res) => {
  try {
    const { product_name, category, unit, unit_price, reorder_level, status } = req.body;
    const result = await pool.query(
      'INSERT INTO products (product_name, category, unit, unit_price, reorder_level, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [product_name, category, unit, unit_price, reorder_level || 10, status || 'active']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update product
app.put('/products/:id', async (req, res) => {
  try {
    const query = buildUpdateQuery("products", "product_id", req.params.id, req.body);
    const result = await pool.query(query.text, query.values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete product
app.delete('/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE product_id=$1', [req.params.id]);
    res.send('Product deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get("/suppliers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM suppliers ORDER BY supplier_id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Add a supplier
app.post('/suppliers', async (req, res) => {
  try {
    const { supplier_name, contact_info, address } = req.body;
    const result = await pool.query(
      'INSERT INTO suppliers (supplier_name, contact_info, address) VALUES ($1,$2,$3) RETURNING *',
      [supplier_name, contact_info, address]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a supplier
app.put('/suppliers/:id', async (req, res) => {
  try {
    const query = buildUpdateQuery("suppliers", "supplier_id", req.params.id, req.body);
    const result = await pool.query(query.text, query.values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a supplier
app.delete('/suppliers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE supplier_id=$1', [req.params.id]);
    res.send('Supplier deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get("/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY customer_id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Add a customer
app.post('/customers', async (req, res) => {
  try {
    const { customer_name, contact_info } = req.body;
    const result = await pool.query(
      'INSERT INTO customers (customer_name, contact_info) VALUES ($1,$2) RETURNING *',
      [customer_name, contact_info]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a customer
app.put('/customers/:id', async (req, res) => {
  try {
    const { customer_name, contact_info } = req.body;
    const result = await pool.query(
      'UPDATE customers SET customer_name=$1, contact_info=$2 WHERE customer_id=$3 RETURNING *',
      [customer_name, contact_info, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a customer
app.delete('/customers/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE customer_id=$1', [req.params.id]);
    res.send('Customer deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         t.transaction_id,
         t.product_id,
         p.product_name,
         t.transaction_type,
         t.quantity,
         t.transaction_date,
         t.supplier_id,
         s.supplier_name,
         t.customer_id,
         c.customer_name,
         t.user_id,
         u.username
       FROM inventory_transactions t
       LEFT JOIN products p ON t.product_id = p.product_id
       LEFT JOIN suppliers s ON t.supplier_id = s.supplier_id
       LEFT JOIN customers c ON t.customer_id = c.customer_id
       LEFT JOIN users u ON t.user_id = u.user_id
       ORDER BY t.transaction_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add an inventory transaction
app.post('/transactions', async (req, res) => {
  try {
    const { product_id, transaction_type, quantity, supplier_id, customer_id, user_id } = req.body;
    const result = await pool.query(
      `INSERT INTO inventory_transactions 
       (product_id, transaction_type, quantity, supplier_id, customer_id, user_id) 
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [product_id, transaction_type, quantity, supplier_id, customer_id, user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update an inventory transaction
app.put('/transactions/:id', async (req, res) => {
  try {
    const query = buildUpdateQuery("inventory_transactions", "transaction_id", req.params.id, req.body);
    const result = await pool.query(query.text, query.values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete an inventory transaction
app.delete('/transactions/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory_transactions WHERE transaction_id=$1', [req.params.id]);
    res.send('Transaction deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});