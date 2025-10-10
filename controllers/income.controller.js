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