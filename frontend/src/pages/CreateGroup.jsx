import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createGroup, updateGroup, getGroupDetails } from '../services/groupService';
import { getUsersByIds } from '../services/authService';
import './CreateGroup.css';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { groupId } = useParams(); // Get groupId if in edit mode
  const isEditMode = !!groupId;

  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([{ name: '', email: '' }]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);

    if (isEditMode) {
      loadGroupData();
    }
  }, [navigate, isEditMode]);

  const loadGroupData = async () => {
    setIsLoading(true);
    try {
      const groupData = await getGroupDetails(groupId);
      setGroupName(groupData.name);

      // Resolve member IDs to names/emails for the form
      if (groupData.members && groupData.members.length > 0) {
        const users = await getUsersByIds(groupData.members);
        // Filter out the current user as they are shown separately or we want to exclude them from the editable list
        const otherMembers = users
          .filter(u => u.id !== JSON.parse(localStorage.getItem('user')).userId)
          .map(u => ({ name: u.name, email: u.email }));

        setMembers(otherMembers.length > 0 ? otherMembers : [{ name: '', email: '' }]);
      }
    } catch (error) {
      setErrorMsg("Failed to load group details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value;
    setMembers(updatedMembers);
  };

  const addMemberField = () => {
    setMembers([...members, { name: '', email: '' }]);
  };

  const removeMemberField = (index) => {
    const updatedMembers = [...members];
    updatedMembers.splice(index, 1);
    setMembers(updatedMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (isEditMode) {
        await updateGroup(groupId, groupName, members);
      } else {
        await createGroup(groupName, members);
      }
      navigate('/dashboard');
    } catch (error) {
      setErrorMsg(`Failed to ${isEditMode ? 'update' : 'create'} group.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-group-container">
      <div className="create-group-card shadow-box">
        <div className="create-group-header">
          <h1>{isEditMode ? 'Edit group' : 'Start a new group'}</h1>
        </div>

        {errorMsg && <div className="error-alert">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label>My group shall be called...</label>
            <input
              type="text"
              className="group-name-input"
              placeholder="e.g. Vacation, Apartment, Dinner"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="divider"></div>

          <div className="form-section">
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#888', letterSpacing: '0.5px' }}>GROUP MEMBERS</label>
            <div className="member-row current-user">
              <img src={`https://ui-avatars.com/api/?name=${currentUser?.name || 'User'}&background=ff652f&color=fff&rounded=true&size=128`} alt="avatar" />
              <div className="member-info">
                <span className="member-name">{currentUser?.name} (You)</span>
                <span className="member-email">{currentUser?.email}</span>
              </div>
            </div>

            {members.map((member, index) => (
              <div key={index} className="member-row animate-in">
                <input
                  type="text"
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={member.email}
                  onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                  required
                />
                {members.length > 1 && (
                  <button type="button" className="remove-btn" onClick={() => removeMemberField(index)}>×</button>
                )}
              </div>
            ))}

            <button type="button" className="add-person-btn" onClick={addMemberField}>
              + Add another person
            </button>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary btn-large" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" className="btn-cancel" onClick={() => navigate('/dashboard')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
