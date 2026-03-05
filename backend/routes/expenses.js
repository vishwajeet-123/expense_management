const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123';

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// GET /api/expenses - Get all expenses for logged in user
router.get('/', auth, (req, res) => {
  try {
    const expenses = db.prepare('SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC').all(req.user.id);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

// POST /api/expenses - Add new expense
router.post('/', auth, (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title || !amount || !category || !date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const info = db.prepare('INSERT INTO expenses (userId, title, amount, category, date) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, title, amount, category, date);
    
    const newExpense = {
      id: info.lastInsertRowid,
      userId: req.user.id,
      title,
      amount,
      category,
      date
    };
    
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error adding expense' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', auth, (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    const expenseId = req.params.id;

    // Verify ownership
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND userId = ?').get(expenseId, req.user.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    db.prepare('UPDATE expenses SET title = ?, amount = ?, category = ?, date = ? WHERE id = ?')
      .run(title, amount, category, date, expenseId);

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', auth, (req, res) => {
  try {
    const expenseId = req.params.id;

    // Verify ownership
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ? AND userId = ?').get(expenseId, req.user.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    db.prepare('DELETE FROM expenses WHERE id = ?').run(expenseId);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

module.exports = router;
