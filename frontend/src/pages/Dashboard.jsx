import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserGroups, deleteGroup, updateGroup } from '../services/groupService';
import { getGroupDashboardData, getDashboardSummary } from '../services/dashboardService';
import { deleteExpense } from '../services/expenseService';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null); // null means "Global Dashboard"
  const [groupMembers, setGroupMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [user, setUser] = useState(null);

  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(storedUser));
    fetchGroups();
    loadGlobalDashboard(); // Load global summary on start
  }, [navigate]);

  useEffect(() => {
    if (activeGroup) {
      loadGroupSpecificDashboard(activeGroup.id);
      setEditedGroupName(activeGroup.name);
      setIsEditingGroup(false);
    } else {
        loadGlobalDashboard();
    }
    setExpandedExpenseId(null);
  }, [activeGroup]);

  const fetchGroups = async () => {
    try {
      const data = await getUserGroups();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const loadGlobalDashboard = async () => {
    setIsLoadingDashboard(true);
    try {
      const data = await getDashboardSummary();
      setGroupMembers(data.members);
      const sortedExpenses = data.expenses.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
      setExpenses(sortedExpenses);
      setBalances([]); // No specific group balances in global view
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const loadGroupSpecificDashboard = async (groupId) => {
    setIsLoadingDashboard(true);
    try {
      const data = await getGroupDashboardData(groupId);
      setGroupMembers(data.members);
      const sortedExpenses = data.expenses.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate));
      setExpenses(sortedExpenses);
      setBalances(data.balances);
    } catch (error) {
      console.error("Error loading group data:", error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      try {
        await deleteGroup(groupId);
        const updatedGroups = groups.filter(g => g.id !== groupId);
        setGroups(updatedGroups);
        setActiveGroup(null); // Return to global dashboard
      } catch (error) {
        alert("Failed to delete group. " + (error.response?.data?.message || ""));
      }
    }
  };

  const handleUpdateGroup = async () => {
    if (!editedGroupName.trim()) return;
    try {
      const updated = await updateGroup(activeGroup.id, editedGroupName);
      setGroups(groups.map(g => g.id === updated.id ? updated : g));
      setActiveGroup(updated);
      setIsEditingGroup(false);
    } catch (error) {
      alert("Failed to update group name.");
    }
  };

  const handleDeleteExpense = async (e, expenseId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(expenseId);
        if (activeGroup) loadGroupSpecificDashboard(activeGroup.id);
        else loadGlobalDashboard();
      } catch (error) {
        alert("Failed to delete expense.");
      }
    }
  };

  const toggleExpenseExpand = (expenseId) => {
    setExpandedExpenseId(expandedExpenseId === expenseId ? null : expenseId);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <ul className="nav-links">
          <li className={!activeGroup ? 'active' : ''} onClick={() => setActiveGroup(null)}>
            <i className="icon-dashboard"></i> Dashboard
          </li>
          <li><i className="icon-flag"></i> Recent activity</li>
        </ul>

        <div className="nav-section">
          <div className="nav-header">
            <span>GROUPS</span>
            <span className="add-btn" onClick={() => navigate('/create-group')}>+ add</span>
          </div>
          <ul className="item-list">
            {groups.map(group => (
              <li
                key={group.id}
                className={activeGroup && activeGroup.id === group.id ? 'active' : ''}
                onClick={() => setActiveGroup(group)}
              >
                <i className="icon-tag"></i>
                {group.name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content shadow-box">
        <div className="content-header">
          <div className="header-title">
            <h2>{!activeGroup ? "Dashboard (All Expenses)" : activeGroup.name}</h2>
          </div>
            {activeGroup && (
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
            )}

        </div>

        {isLoadingDashboard ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>
        ) : (
          <div className="expenses-list">
            {expenses.length === 0 ? (
              <div className="settled-notice">No expenses found.</div>
            ) : (
              expenses.map((expense) => {
                const date = new Date(expense.expenseDate);
                const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                const day = date.getDate().toString().padStart(2, '0');

                const payer = groupMembers.find(m => m.id === expense.paidBy);
                const payerName = expense.paidBy === user?.userId ? 'you' : (payer?.name || 'Someone');
                const mySplit = expense.splits?.find(s => s.userId === user?.userId);

                let balanceText = "not involved";
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
                }

                const isExpanded = expandedExpenseId === expense.id;

                return (
                  <div 
                    key={expense.id} 
                    className={`expense-item-container ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleExpenseExpand(expense.id)}
                  >
                    <div className="expense-item">
                      <div className="expense-date">
                        <span className="month">{month}</span>
                        <span className="day">{day}</span>
                      </div>
                      <div className="expense-icon">
                         <img src="https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png" width="30" alt="icon" />
                      </div>
                      <div className="expense-desc">
                        <span className="desc">{expense.description}</span>
                        {!activeGroup && (
                          <span style={{fontSize: '11px', color: '#999', display: 'block'}}>
                             In {groups.find(g => g.id === expense.groupId)?.name || 'Unknown Group'}
                          </span>
                        )}
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

                    {isExpanded && activeGroup && (
                      <div className="expense-actions-tray animate-in">
                        <div className="tray-content">
                          <button className="btn-edit-expense" onClick={(e) => navigate(`/group/${activeGroup.id}/edit-expense/${expense.id}`)}>Edit</button>
                          <button className="btn-delete-expense" onClick={(e) => handleDeleteExpense(e, expense.id)}>Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="right-sidebar">
        {activeGroup && (
          <>
            <div className="balances-section">
              <h3>GROUP BALANCES</h3>
              {groupMembers.length > 0 ? (
                groupMembers.map(member => {
                  const balanceData = balances.find(b => b.userId === member.id);
                  const balance = balanceData ? balanceData.balance : 0;
                  const isUser = member.id === user?.userId;

                  return (
                    <div key={member.id} className="balance-item">
                      <img src={`https://ui-avatars.com/api/?name=${member.name}&background=${isUser ? 'ff652f' : 'ccc'}&color=fff&rounded=true`} width="30" alt="user" />
                      <div className="balance-info">
                        <span className="name">{isUser ? 'You' : member.name}</span>
                        <span className="owes" style={{ color: balance > 0 ? 'var(--primary-color)' : (balance < 0 ? '#ff4444' : '#999') }}>
                          {balance > 0 ? `gets back ₹${balance.toFixed(2)}` : (balance < 0 ? `owes ₹${Math.abs(balance).toFixed(2)}` : 'settled up')}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{color: '#999', fontSize: '13px'}}>No members found.</div>
              )}
            </div>

            {/* Group Settings - Only for Creator */}
            {user && activeGroup.createdBy === user.userId && (
              <div className="group-settings-section" style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '11px', color: '#999', marginBottom: '15px' }}>GROUP SETTINGS</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
          </>
        )}
        
        {!activeGroup && (
          <div className="total-summary-card">
            <h3>TOTAL SUMMARY</h3>
            <div style={{ color: '#999', fontSize: '13px', lineHeight: '1.6' }}>
              This view shows activity from all your groups combined. <br/><br/>
              Select a group from the sidebar to see specific balances, edit group settings, or settle up.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
