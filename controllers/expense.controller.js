import { Expense } from "../models/expense.model.js";


export const addExpense = async (req, res) => {

    const { userId, amount, category, date, notes } = req.body

    try {
        if ([userId, amount, category, date].some((item) => item === "" || item === undefined)) {
            return res.status(401).json({ message: "All top 3 fields are required" })
        }
        const expense = await Expense.create({
            userId,
            amount,
            category,
            date,
            notes,
            
           

        })

        res.status(200).json({ expense })



    } catch (error) {
        res.status(400).json({ message: "", error })

    }
}

export const getExpenses = async (req, res) => {
  try {
    const { userId } = req.query; // frontend should pass ?userId=...

    const expenses = await Expense.find({ userId }).sort({ date: 1 });

    res.status(200).json({expenses});
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch expenses", error: error.message });
  }
};

export const updateExpense=async(req,res)=>{
  try {
    const {expenseId}=req.params
    if (!expenseId) {
      res.status(401).json({message:"problem in updating expense, no userID found"})
    }
    const updateExpense=await Expense.findByIdAndUpdate(expenseId,req.body,{
      new:true
    })

    if (!updateExpense) {
      res.status(400).json({message:"Unable to fetch updated expense"})
    }
    res.status(200).json({
      success:true,
      updateExpense:updateExpense,
      message:"expense updated successfully"
      
    })
  } catch (error) {
    res.status(401).json({message:"User unauthorized"})
  }
}

export const deleteExpense=async(req,res)=>{
  try {
    const {expenseId}=req.params
    if (!expenseId) {
      res.status(400).json({message:"unable to find userId to delete Expense"})
    }
    const deleteExpense=await Expense.findByIdAndDelete(expenseId,{
      new:true
    })
    if (!deleteExpense) {
      res.status(401).json({message:"unable to delete expense"})
    }
    res.status(200).json({
      success:true,
      deleteExpense:deleteExpense,
      message:"Expense deleted successfully"
    })
  } catch (error) {
    res.status(401).json({message:"user unauthorized"})
  }
}