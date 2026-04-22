import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserGroups, createGroup, deleteGroup, updateGroup } from '../services/groupService';
import { getUsersByIds } from '../services/authService';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
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
      setEditedName(activeGroup.name);
      setIsEditing(false);
    }
  }, [activeGroup]);

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
                <i className="icon-tag" style={activeGroup && activeGroup.id === group.id ? {color: 'var(--primary-color)'} : {}}></i> 
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
                <img src="https://assets.splitwise.com/assets/fat_rabbit/avatars/50-31b0bb8f5dea32a61361c4df19d084793f773cd395b2d2fcded51bceafb1fdfb.png" alt="Group" width="40" className="group-avatar" />
                <div>
                  {isEditing ? (
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
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
                    <h2>{activeGroup.name}</h2>
                  )}
                  <span className="subtitle">{groupMembers.length} members</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="btn-primary" style={{backgroundColor: '#ff652f'}}>Add an expense</button>
                <button className="btn-primary">Settle up</button>
              </div>
            </div>
            
            <div className="expenses-list">
              <div className="settled-notice">
                Expenses feature is coming soon in Step 3! <br/>
                Currently displaying mock layout.
              </div>
              
              <div className="month-divider">JANUARY 2026</div>
              <div className="expense-item">
                <div className="expense-date">
                  <span className="month">JAN</span>
                  <span className="day">05</span>
                </div>
                <div className="expense-icon">
                   <img src="https://s3.amazonaws.com/splitwise/uploads/category/icon/square_v2/uncategorized/general@2x.png" width="30" alt="icon"/>
                </div>
                <div className="expense-desc">
                  <span className="desc">movie</span>
                </div>
                <div className="expense-paid">
                  <span className="label">you paid</span>
                  <span className="amount">USD100.00</span>
                </div>
                <div className="expense-lent">
                  <span className="label">you lent</span>
                  <span className="amount" style={{color: 'var(--primary-color)'}}>USD66.67</span>
                </div>
              </div>
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
            <div className="group-settings-section">
              <h3 style={{marginBottom: '10px'}}>GROUP SETTINGS</h3>
              {user && activeGroup.createdBy === user.userId && (
                <div className="settings-actions" style={{display: 'flex', gap: '10px'}}>
                  <button 
                    className="btn-outline-sm" 
                    onClick={() => navigate(`/edit-group/${activeGroup.id}`)}
                  >
                    ✎ Edit group
                  </button>
                  <button 
                    className="btn-outline-sm" 
                    style={{color: '#ff4444', borderColor: '#ff4444'}}
                    onClick={() => handleDeleteGroup(activeGroup.id)}
                  >
                    🗑 Delete group
                  </button>
                </div>
              )}
            </div>

            <div className="balances-section">
              <h3>GROUP BALANCES</h3>
              {groupMembers.map(member => (
                <div key={member.id} className="balance-item">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${member.name}&background=${member.id === user?.userId ? 'ff652f' : 'ccc'}&color=fff&rounded=true`} 
                    width="30" 
                    alt="user" 
                  />
                  <div className="balance-info">
                    <span className="name">{member.id === user?.userId ? 'You' : member.name}</span>
                    <span className="owes" style={{color: member.id === user?.userId ? 'var(--primary-color)' : '#999'}}>
                      {member.id === user?.userId ? 'you are all settled up' : 'is settled up'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
