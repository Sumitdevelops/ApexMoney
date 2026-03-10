import { Expense } from "../models/expense.model.js";


export const addExpense = async (req, res) => {

  const { amount, category, date, notes, currency, tags } = req.body
  const userId = req.session.userId;

  try {
    if (!userId) {
      return res.status(401).json({ message: "Authentication required. Please log in again." });
    }
    if ([amount, category, date].some((item) => item === "" || item === undefined)) {
      return res.status(400).json({ message: "All required fields must be provided" })
    }
    const expense = await Expense.create({
      userId,
      amount,
      category,
      date,
      notes,
      currency: currency || 'INR', // Default to INR if not provided
      tags: tags || [],
    })

    res.status(200).json({ expense })



  } catch (error) {
    console.error("addExpense error:", error);
    res.status(400).json({ message: "Failed to add expense. Please try again.", error: error.message })
  }
}

export const getExpenses = async (req, res) => {
  try {
    const userId = req.session.userId;

    const expenses = await Expense.find({ userId }).sort({ date: 1 });

    res.status(200).json({ expenses });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses", error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params
    if (!expenseId) {
      res.status(401).json({ message: "problem in updating expense, no userID found" })
    }
    const updateExpense = await Expense.findByIdAndUpdate(expenseId, req.body, {
      new: true
    })

    if (!updateExpense) {
      res.status(400).json({ message: "Unable to fetch updated expense" })
    }
    res.status(200).json({
      success: true,
      updateExpense: updateExpense,
      message: "expense updated successfully"

    })
  } catch (error) {
    res.status(401).json({ message: "User unauthorized" })
  }
}

export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params
    if (!expenseId) {
      res.status(400).json({ message: "unable to find userId to delete Expense" })
    }
    const deleteExpense = await Expense.findByIdAndDelete(expenseId, {
      new: true
    })
    if (!deleteExpense) {
      res.status(401).json({ message: "unable to delete expense" })
    }
    res.status(200).json({
      success: true,
      deleteExpense: deleteExpense,
      message: "Expense deleted successfully"
    })
  } catch (error) {
    res.status(401).json({ message: "user unauthorized" })
  }
}