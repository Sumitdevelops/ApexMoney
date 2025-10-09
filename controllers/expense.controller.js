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