import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserGroups, createGroup, deleteGroup, updateGroup } from '../services/groupService';
import { getUsersByIds } from '../services/authService';
import { getGroupExpenses, getGroupBalances } from '../services/expenseService';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]); // Real balances from backend
  const [user, setUser] = useState(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchGroups();
  }, [navigate]);

  useEffect(() => {
    if (activeGroup && activeGroup.members) {
      fetchMemberDetails(activeGroup.members);
      fetchExpenses(activeGroup.id);
      fetchBalances(activeGroup.id);
      setEditedName(activeGroup.name);
      setIsEditing(false);
    }
  }, [activeGroup]);

  const fetchExpenses = async (groupId) => {
    try {
      const data = await getGroupExpenses(groupId);
      const sorted = data.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
      setExpenses(sorted);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    }
  };

  const fetchBalances = async (groupId) => {
    try {
      const data = await getGroupBalances(groupId);
      setBalances(data);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await getUserGroups();
      setGroups(data);
      if (data.length > 0 && !activeGroup) {
        setActiveGroup(data[0]);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchMemberDetails = async (memberIds) => {
    try {
      const users = await getUsersByIds(memberIds);
      setGroupMembers(users);
    } catch (error) {
      console.error("Error fetching member details:", error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this group? All expenses will be lost.")) {
      try {
        await deleteGroup(groupId);
        const updatedGroups = groups.filter(g => g.id !== groupId);
        setGroups(updatedGroups);
        setActiveGroup(updatedGroups.length > 0 ? updatedGroups[0] : null);
      } catch (error) {
        alert("Failed to delete group. Only the creator can delete the group.");
      }
    }
  };

  const handleUpdateGroup = async () => {
    if (!editedName.trim()) return;
    try {
      const updated = await updateGroup(activeGroup.id, editedName);
      setGroups(groups.map(g => g.id === updated.id ? updated : g));
      setActiveGroup(updated);
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update group name.");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <ul className="nav-links">
          <li><i className="icon-dashboard"></i> Dashboard</li>
          <li className="active"><i className="icon-flag"></i> Recent activity</li>
        </ul>

        <div className="search-box">
          <input type="text" placeholder="Filter by name" />
        </div>

        <div className="nav-section">
          <div className="nav-header">
            <span>GROUPS</span>
            <span className="add-btn" onClick={() => navigate('/create-group')}>+ add</span>
          </div>

          <ul className="item-list">
            {groups.length === 0 && (
              <li style={{ fontSize: '12px', color: '#999' }}>No groups yet.</li>
            )}
            {groups.map(group => (
              <li
                key={group.id}
                className={activeGroup && activeGroup.id === group.id ? 'active' : ''}
                onClick={() => setActiveGroup(group)}
              >
                <i className="icon-tag" style={activeGroup && activeGroup.id === group.id ? { color: 'var(--primary-color)' } : {}}></i>
                {group.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-section">
          <div className="nav-header">
            <span>FRIENDS</span>
            <span className="add-btn">+ add</span>
          </div>
          <ul className="item-list">
            <li><i className="icon-user"></i> Krishna</li>
            <li><i className="icon-user"></i> Sameer</li>
          </ul>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content shadow-box">
        {activeGroup ? (
          <>
            <div className="content-header">
              <div className="header-title">
                <div>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="edit-group-input"
                        autoFocus
                      />
                      <button className="btn-save-sm" onClick={handleUpdateGroup}>Save</button>
                      <button className="btn-cancel-sm" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0 }}>{activeGroup.name}</h2>
                      {user && activeGroup.createdBy === user.userId}
                    </div>
                  )}
                </div>
              </div>
              <div className="header-actions">
                <button
                  className="btn-primary"
                  style={{ backgroundColor: '#ff652f' }}
                  onClick={() => navigate(`/group/${activeGroup.id}/add-expense`)}
                >
                  Add an expense
                </button>
                <button className="btn-primary">Settle up</button>
              </div>
            </div>

            <div className="expenses-list">
              {expenses.length === 0 ? (
                <div className="settled-notice">
                  No expenses in this group yet. <br />
                  Click "Add an expense" to get started!
                </div>
              ) : (
                expenses.map((expense) => {
                  const date = new Date(expense.expenseDate);
                  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                  const day = date.getDate().toString().padStart(2, '0');

                  const payer = groupMembers.find(m => m.id === expense.paidBy);
                  const payerName = expense.paidBy === user?.userId ? 'you' : (payer?.name || 'Someone');

                  const mySplit = expense.splits.find(s => s.userId === user?.userId);

                  let balanceText = "";
                  let balanceAmount = 0;
                  let balanceColor = "#999";

                  if (expense.paidBy === user?.userId) {
                    const othersOwe = expense.amount - (mySplit ? mySplit.amount : 0);
                    balanceText = "you lent";
                    balanceAmount = othersOwe;
                    balanceColor = "var(--primary-color)";
                  } else if (mySplit) {
                    balanceText = "you borrowed";
                    balanceAmount = mySplit.amount;
                    balanceColor = "#ff4444";
                  } else {
                    balanceText = "not involved";
                    balanceAmount = 0;
                  }

                  return (
                    <div key={expense.id} className="expense-item">
                      <div className="expense-date">
                        <span className="month">{month}</span>
                        <span className="day">{day}</span>
                      </div>
                      <div className="expense-icon">
                        <img src="https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png" width="30" alt="icon" />
                      </div>
                      <div className="expense-desc">
                        <span className="desc">{expense.description}</span>
                        {expense.note && <span style={{ fontSize: '11px', color: '#999', display: 'block' }}>{expense.note}</span>}
                      </div>
                      <div className="expense-paid">
                        <span className="label">{payerName} paid</span>
                        <span className="amount">₹{expense.amount.toFixed(2)}</span>
                      </div>
                      <div className="expense-lent">
                        <span className="label">{balanceText}</span>
                        <span className="amount" style={{ color: balanceColor }}>
                          {balanceAmount > 0 ? `₹${balanceAmount.toFixed(2)}` : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <h2>Welcome to Splitwise!</h2>
            <p>Create a group to get started.</p>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        {activeGroup && (
          <>
            <div className="balances-section">
              <h3>GROUP BALANCES</h3>
              {groupMembers.map(member => {
                const balanceData = balances.find(b => b.userId === member.id);
                const balance = balanceData ? balanceData.balance : 0;
                const isUser = member.id === user?.userId;

                return (
                  <div key={member.id} className="balance-item">
                    <img
                      src={`https://ui-avatars.com/api/?name=${member.name}&background=${isUser ? 'ff652f' : 'ccc'}&color=fff&rounded=true`}
                      width="30"
                      alt="user"
                    />
                    <div className="balance-info">
                      <span className="name">{isUser ? 'You' : member.name}</span>
                      {balance > 0 ? (
                        <span className="owes" style={{ color: 'var(--primary-color)' }}>
                          {isUser ? 'you get back' : 'gets back'} <b>₹{balance.toFixed(2)}</b>
                        </span>
                      ) : balance < 0 ? (
                        <span className="owes" style={{ color: '#ff4444' }}>
                          {isUser ? 'you owe' : 'owes'} <b>₹{Math.abs(balance).toFixed(2)}</b>
                        </span>
                      ) : (
                        <span className="owes" style={{ color: '#999' }}>
                          {isUser ? 'you are settled up' : 'is settled up'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="group-settings-section" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              {user && activeGroup.createdBy === user.userId && (
                <div className="settings-actions" style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  <h3 style={{ marginBottom: '10px' }}>GROUP SETTINGS</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className="btn-outline-sm"
                      onClick={() => navigate(`/edit-group/${activeGroup.id}`)}
                    >
                      Edit group
                    </button>
                    <button
                      className="btn-outline-sm"
                      onClick={() => handleDeleteGroup(activeGroup.id)}
                    >
                      Delete group
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
