const express = require('express');
const app = express();
const port = 3000;
const pool = require('./db');

app.use(express.json());

app.post('/signup', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1,$2,$3) RETURNING user_id, username, role',
      [username, password_hash, role || 'staff']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // find user
    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ msg: "User not found" });
    }

    const user = result.rows[0];

    // compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // create token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

function authMiddleware(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { user_id, role }
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied: Admins only" });
  }
  next();
}

// Add new user
app.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
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
app.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
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
app.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE user_id=$1', [req.params.id]);
    res.send('User deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//Add a product
app.post('/products', authMiddleware, async (req, res) => {
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
app.put('/products/:id', authMiddleware, async (req, res) => {
  try {
    const { product_name, category, unit, unit_price, reorder_level, status } = req.body;
    const result = await pool.query(
      `UPDATE products 
       SET product_name=$1, category=$2, unit=$3, unit_price=$4, reorder_level=$5, status=$6 
       WHERE product_id=$7 RETURNING *`,
      [product_name, category, unit, unit_price, reorder_level, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete product
app.delete('/products/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE product_id=$1', [req.params.id]);
    res.send('Product deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a supplier
app.post('/suppliers', authMiddleware, async (req, res) => {
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
app.put('/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    const { supplier_name, contact_info, address } = req.body;
    const result = await pool.query(
      'UPDATE suppliers SET supplier_name=$1, contact_info=$2, address=$3 WHERE supplier_id=$4 RETURNING *',
      [supplier_name, contact_info, address, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a supplier
app.delete('/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE supplier_id=$1', [req.params.id]);
    res.send('Supplier deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a customer
app.post('/customers', authMiddleware, async (req, res) => {
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
app.put('/customers/:id', authMiddleware, async (req, res) => {
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
app.delete('/customers/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE customer_id=$1', [req.params.id]);
    res.send('Customer deleted');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add an inventory transaction
app.post('/transactions', authMiddleware, async (req, res) => {
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
app.put('/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { transaction_type, quantity, supplier_id, customer_id, user_id } = req.body;
    const result = await pool.query(
      `UPDATE inventory_transactions 
       SET transaction_type=$1, quantity=$2, supplier_id=$3, customer_id=$4, user_id=$5 
       WHERE transaction_id=$6 RETURNING *`,
      [transaction_type, quantity, supplier_id, customer_id, user_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete an inventory transaction
app.delete('/transactions/:id', authMiddleware, async (req, res) => {
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