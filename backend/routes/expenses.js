const express = require('express');
const jwt = require('jsonwebtoken');
const Expense = require('../models/Expense');
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
router.get('/', auth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

// POST /api/expenses - Add new expense
router.post('/', auth, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    if (!title || !amount || !category || !date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newExpense = new Expense({
      userId: req.user.id,
      title,
      amount,
      category,
      date
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: 'Error adding expense' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, amount, category, date } = req.body;
    const expenseId = req.params.id;

    const expense = await Expense.findOneAndUpdate(
      { _id: expenseId, userId: req.user.id },
      { title, amount, category, date },
      { new: true }
    );

    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    res.json({ message: 'Expense updated successfully', expense });
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const expenseId = req.params.id;

    const expense = await Expense.findOneAndDelete({ _id: expenseId, userId: req.user.id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

module.exports = router;
