import axios from 'axios';

// Note: API Gateway runs on port 8080
const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';
const EXPENSE_API_URL = `${GATEWAY_URL}/api/expenses`;

export const createExpense = async (expenseData) => {
    const response = await axios.post(EXPENSE_API_URL, expenseData);
    return response.data;
};

export const calculateSplits = async (expenseData) => {
    const response = await axios.post(`${EXPENSE_API_URL}/calculate`, expenseData);
    return response.data;
};

export const getGroupExpenses = async (groupId) => {
    const response = await axios.get(`${EXPENSE_API_URL}/group/${groupId}`);
    return response.data;
};

export const getGroupBalances = async (groupId) => {
    const response = await axios.get(`${EXPENSE_API_URL}/group/${groupId}/balances`);
    return response.data;
};

export const getExpenseDetails = async (expenseId) => {
    const response = await axios.get(`${EXPENSE_API_URL}/${expenseId}`);
    return response.data;
};

export const updateExpense = async (expenseId, expenseData) => {
    const response = await axios.put(`${EXPENSE_API_URL}/${expenseId}`, expenseData);
    return response.data;
};

export const deleteExpense = async (expenseId) => {
    const response = await axios.delete(`${EXPENSE_API_URL}/${expenseId}`);
    return response.data;
};
