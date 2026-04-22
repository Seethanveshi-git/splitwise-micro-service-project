import axios from 'axios';

const EXPENSE_API_URL = 'http://localhost:8083/api/expenses';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const createExpense = async (expenseData) => {
    const response = await axios.post(EXPENSE_API_URL, expenseData, getAuthHeaders());
    return response.data;
};

export const calculateSplits = async (expenseData) => {
    const response = await axios.post(`${EXPENSE_API_URL}/calculate`, expenseData, getAuthHeaders());
    return response.data;
};

export const getGroupExpenses = async (groupId) => {
    const response = await axios.get(`${EXPENSE_API_URL}/group/${groupId}`, getAuthHeaders());
    return response.data;
};

export const getGroupBalances = async (groupId) => {
    const response = await axios.get(`${EXPENSE_API_URL}/group/${groupId}/balances`, getAuthHeaders());
    return response.data;
};
