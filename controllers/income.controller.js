import { Income } from "../models/income.model.js";


export const addIncome = async (req, res) => {

    const { userId, amount, category, date, notes } = req.body

    try {
        if ([userId, amount, category, date].some((item) => item === "" || item === undefined)) {
            return res.status(401).json({ message: "All top 3 fields are required" })
        }
        const income = await Income.create({
            userId,
            amount,
            category,
            date,
            notes,
            

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

export const updateIncome=async(req,res)=>{
  try {
    const {incomeId}=req.params
    if (!incomeId) {
      res.status(401).json({message:"problem in updating expense, no userID found"})
    }
    const updateIncome=await Expense.findByIdAndUpdate(incomeId,req.body,{
      new:true
    })

    if (!updateIncome) {
      res.status(400).json({message:"Unable to fetch updated expense"})
    }
    res.status(200).json({
      success:true,
      updateIncome:updateIncome,
      message:"expense updated successfully"
      
    })
  } catch (error) {
    res.status(401).json({message:"User unauthorized"})
  }
}

export const deleteIncome=async(req,res)=>{
  try {
    const {incomeId}=req.params
    if (!incomeId) {
      res.status(400).json({message:"unable to find userId to delete Expense"})
    }
    const deleteIncome=await Expense.findByIdAndDelete(incomeId,{
      new:true
    })
    if (!deleteIncome) {
      res.status(401).json({message:"unable to delete expense"})
    }
    res.status(200).json({
      success:true,
      deleteIncome:deleteIncome,
      message:"Expense deleted successfully"
    })
  } catch (error) {
    res.status(401).json({message:"user unauthorized"})
  }
}