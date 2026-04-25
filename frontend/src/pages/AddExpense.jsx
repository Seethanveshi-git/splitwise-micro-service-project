import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGroupDetails, getUserGroups } from '../services/groupService';
import { getUsersByIds } from '../services/authService';
import { createExpense, updateExpense, getExpenseDetails, calculateSplits } from '../services/expenseService';
import './AddExpense.css';

const AddExpense = () => {
  const { groupId: initialGroupId, expenseId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!expenseId;

  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || '');
  const [members, setMembers] = useState([]);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState('');
  const [splits, setSplits] = useState([]);
  const [calculatedSplits, setCalculatedSplits] = useState([]);

  const getLocalDatetime = (dateObj = new Date()) => {
    const now = dateObj;
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [expenseDate, setExpenseDate] = useState(getLocalDatetime());
  const [note, setNote] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAllGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupMembers(selectedGroupId);
    }
  }, [selectedGroupId]);

  const loadExpenseDetails = async (id) => {
    try {
      const expense = await getExpenseDetails(id);
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setPaidBy(expense.paidBy.toString());
      setSplitType(expense.splitType);
      setNote(expense.note || '');
      setExpenseDate(getLocalDatetime(new Date(expense.expenseDate)));

      // Wait for members to be loaded before setting splits
      const splitData = expense.splits.map(s => ({
        userId: s.userId,
        amount: expense.splitType === 'EQUAL' ? '' : s.amount.toString(),
        selected: true
      }));
      setSplits(splitData);
    } catch (error) {
      setErrorMsg("Failed to load expense details.");
    }
  };

  // Memoized calculation handler
  const triggerCalculation = useCallback(async (currentAmount, currentSplitType, currentSplits) => {
    if (!currentAmount || !currentSplitType || currentSplits.length === 0) {
      setCalculatedSplits([]);
      return;
    }

    setIsCalculating(true);
    try {
      const selectedSplits = currentSplits.filter(s => currentSplitType === 'EQUAL' ? s.selected : true);

      const requestData = {
        amount: parseFloat(currentAmount),
        splitType: currentSplitType,
        splits: selectedSplits.map(s => ({
          userId: s.userId,
          amount: currentSplitType === 'EQUAL' ? 0 : parseFloat(s.amount || 0)
        }))
      };

      const result = await calculateSplits(requestData);
      setCalculatedSplits(result);
    } catch (error) {
      console.error("Calculation failed:", error);
    } finally {
      setIsCalculating(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerCalculation(amount, splitType, splits);
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, splitType, splits, triggerCalculation]);

  const fetchAllGroups = async () => {
    try {
      const groups = await getUserGroups();
      setAllGroups(groups);
      if (!selectedGroupId && groups.length > 0 && !isEditMode) {
        setSelectedGroupId(groups[0].id);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const loadGroupMembers = async (gid) => {
    try {
      const groupData = await getGroupDetails(gid);
      const memberIds = groupData.members.map(m => m.userId);
      const users = await getUsersByIds(memberIds);

      // Map official names to nicknames from the group
      const membersWithNicknames = users.map(u => {
        const memberInfo = groupData.members.find(m => m.userId === u.id);
        return {
          ...u,
          name: memberInfo?.nickname || u.name
        };
      });

      setMembers(membersWithNicknames);

      if (!isEditMode) {
        const currentUser = JSON.parse(localStorage.getItem('user'));
        setPaidBy(currentUser.userId);

        const initialSplits = users.map(u => ({
          userId: u.id,
          amount: '',
          selected: true
        }));
        setSplits(initialSplits);
      } else {
        // If in edit mode, fetch details after members are loaded to ensure we have user info
        await loadExpenseDetails(expenseId);
      }
    } catch (error) {
      setErrorMsg("Failed to load group members.");
    }
  };

  const handleSplitValueChange = (userId, value) => {
    setSplits(splits.map(s =>
      s.userId === userId ? { ...s, amount: value } : s
    ));
  };

  const toggleMemberSelection = (userId) => {
    setSplits(splits.map(s =>
      s.userId === userId ? { ...s, selected: !s.selected } : s
    ));
  };

  const validateTotals = () => {
    if (splitType === 'EXACT') {
      const total = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      if (Math.abs(total - parseFloat(amount)) > 0.01) {
        setErrorMsg(`Total must equal ₹${amount}. Current total: ₹${total.toFixed(2)}`);
        return false;
      }
    } else if (splitType === 'PERCENTAGE') {
      const total = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        setErrorMsg(`Total percentage must be 100%. Current total: ${total.toFixed(2)}%`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!splitType) {
      setErrorMsg("Please select a split type.");
      return;
    }

    if (!validateTotals()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const selectedSplits = splits.filter(s => splitType === 'EQUAL' ? s.selected : true);

      const requestData = {
        description,
        amount: parseFloat(amount),
        groupId: parseInt(selectedGroupId),
        paidBy: parseInt(paidBy),
        splitType,
        note,
        expenseDate: expenseDate.includes('Z') ? expenseDate : expenseDate + ":00",
        splits: selectedSplits.map(s => ({
          userId: s.userId,
          amount: splitType === 'EQUAL' ? 0 : parseFloat(s.amount || 0)
        }))
      };

      if (isEditMode) {
        await updateExpense(expenseId, requestData);
      } else {
        await createExpense(requestData);
      }
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.status === 429) {
        setErrorMsg("Add expenses limit exists.");
      } else {
        setErrorMsg(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} expense.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-expense-container">
      <div className="expense-card">
        <h1 className="expense-header-title">{isEditMode ? 'Edit Expense' : 'Add Expense'}</h1>

        {errorMsg && <div className="error-alert">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter a description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Amount</label>
            <div className="amount-input-group">
              <select className="currency-select">
                <option>₹ INR</option>
              </select>
              <input
                type="number"
                step="0.01"
                className="input-field amount-input-field"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Select Groups</label>
            <select
              className="group-dropdown"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              required
              disabled={isEditMode}
            >
              <option value="" disabled>Select a group</option>
              {allGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Paid By</label>
            <select className="input-field" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.id === JSON.parse(localStorage.getItem('user')).userId ? 'You' : m.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Split Type</label>
            <select className="input-field" value={splitType} onChange={(e) => setSplitType(e.target.value)} required>
              <option value="" disabled>Select</option>
              <option value="EQUAL">Equally</option>
              <option value="EXACT">Exact amounts</option>
              <option value="PERCENTAGE">Percentages</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date & Time</label>
            <input
              type="datetime-local"
              className="date-input"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Note (optional)</label>
            <textarea
              className="note-input"
              placeholder="Add a note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Dynamic Split Breakdown */}
          {splitType && (
            <div className="split-members-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Split Breakdown</label>
                {isCalculating && <span style={{ fontSize: '11px', color: '#00b04f' }}>Calculating...</span>}
              </div>
              {splits.map((split) => {
                const member = members.find(m => m.id === split.userId);
                const backendCalc = calculatedSplits.find(cs => cs.userId === split.userId);

                return (
                  <div key={split.userId} className="member-row">
                    <div className="user-info">
                      {splitType === 'EQUAL' && (
                        <input
                          type="checkbox"
                          checked={split.selected}
                          onChange={() => toggleMemberSelection(split.userId)}
                        />
                      )}
                      <img src={`https://ui-avatars.com/api/?name=${member?.name}&background=eee&color=666&rounded=true`} width="30" alt="avatar" />
                      <span>{member?.id === JSON.parse(localStorage.getItem('user')).userId ? 'You' : member?.name}</span>
                    </div>

                    <div className="split-input-group">
                      {splitType === 'EQUAL' ? (
                        split.selected ? (
                          <span className="split-amount-display">₹{backendCalc ? backendCalc.amount.toFixed(2) : '0.00'}</span>
                        ) : (
                          <span style={{ color: '#ccc', fontSize: '14px' }}>Excluded</span>
                        )
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              type="number"
                              step="0.01"
                              className="split-input-sm"
                              placeholder={splitType === 'PERCENTAGE' ? '%' : '0.00'}
                              value={split.amount}
                              onChange={(e) => handleSplitValueChange(split.userId, e.target.value)}
                            />
                            <span style={{ fontSize: '14px', color: '#999' }}>{splitType === 'PERCENTAGE' ? '%' : '₹'}</span>
                          </div>
                          {splitType === 'PERCENTAGE' && backendCalc && (
                            <span style={{ fontSize: '12px', color: '#00b04f' }}>₹{backendCalc.amount.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: '15px' }}>
            <button type="submit" className="btn-save-expense" style={{ flex: 1 }} disabled={isLoading}>
              {isLoading ? 'Saving...' : (isEditMode ? 'Update Expense' : 'Save Expense')}
            </button>
            <button type="button" className="btn-cancel" style={{ padding: '0 20px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;
