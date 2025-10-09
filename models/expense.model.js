import mongoose from 'mongoose'

const expenseSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
     },
    amount: {
        type: Number,
        required: true

    },
    category: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    notes: {
        type: String,
    }


})

export const Expense = mongoose.model("Expense", expenseSchema)