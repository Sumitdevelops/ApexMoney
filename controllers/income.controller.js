import { Income } from "../models/income.model.js";


export const addIncome = async (req, res) => {

  const { userId, amount, category, date, notes, currency, tags, source } = req.body

  try {
    if ([userId, amount, category, date].some((item) => item === "" || item === undefined)) {
      return res.status(400).json({ message: "All fields are required" })
    }
    const income = await Income.create({
      userId,
      amount,
      category,
      date,
      notes,
      currency: currency || 'INR', // Default to INR if not provided
      tags: tags || [],
      source: source || '',
    })

    res.status(200).json({ income })



  } catch (error) {
    res.status(400).json({ message: "", error })

  }
}


export const getIncome = async (req, res) => {
  try {
    const { userId } = req.query; // frontend should pass ?userId=...

    const income = await Income.find({ userId }).sort({ date: 1 });

    res.status(200).json(income);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses", error: error.message });
  }
};

export const updateIncome = async (req, res) => {
  try {
    const { incomeId } = req.params
    if (!incomeId) {
      res.status(400).json({ message: "problem in updating income, no incomeID found" })
    }
    const updateIncome = await Income.findByIdAndUpdate(incomeId, req.body, {
      new: true
    })

    if (!updateIncome) {
      res.status(404).json({ message: "Unable to find income to update" })
    }
    res.status(200).json({
      success: true,
      updateIncome: updateIncome,
      message: "income updated successfully"

    })
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
}

export const deleteIncome = async (req, res) => {
  try {
    const { incomeId } = req.params
    if (!incomeId) {
      res.status(400).json({ message: "unable to find incomeId to delete income" })
    }
    const deleteIncome = await Income.findByIdAndDelete(incomeId, {
      new: true
    })
    if (!deleteIncome) {
      res.status(404).json({ message: "unable to find income" })
    }
    res.status(200).json({
      success: true,
      deleteIncome: deleteIncome,
      message: "Income deleted successfully"
    })
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
}