import api from './api';

export const createExpense = async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
};

export const getUserExpenses = async () => {
    const response = await api.get('/expenses');
    return response.data;
};

export const getGroupExpenses = async (groupId) => {
    const response = await api.get(`/expenses/group/${groupId}`);
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
};

export const getExpenseDetails = async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
};

export const updateExpense = async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
};

export const calculateSplits = async (requestData) => {
    const response = await api.post('/expenses/calculate', requestData);
    return response.data;
};
