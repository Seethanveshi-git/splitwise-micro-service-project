import api from './api';

export const createExpense = async (expenseData) => {
    const response = await api.post('/api/expenses', expenseData);
    return response.data;
};

export const getUserExpenses = async () => {
    const response = await api.get('/api/expenses');
    return response.data;
};

export const getGroupExpenses = async (groupId) => {
    const response = await api.get(`/api/expenses/group/${groupId}`);
    return response.data;
};

export const deleteExpense = async (id) => {
    const response = await api.delete(`/api/expenses/${id}`);
    return response.data;
};

export const getExpenseDetails = async (id) => {
    const response = await api.get(`/api/expenses/${id}`);
    return response.data;
};

export const updateExpense = async (id, expenseData) => {
    const response = await api.put(`/api/expenses/${id}`, expenseData);
    return response.data;
};

export const calculateSplits = async (requestData) => {
    const response = await api.post('/api/expenses/calculate', requestData);
    return response.data;
};
