import { useState } from 'react';
import { createGroup } from '../services/api';

export default function CreateGroupModal({ currentUser, allUsers, onGroupCreated, onClose }) {
  const [step, setStep] = useState(1); // 1: Select members/Action list, 2: Group Name
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    setError('');
    if (!groupName.trim()) return setError('Group name is required');
    setLoading(true);
    try {
      const group = await createGroup(groupName.trim(), selectedMembers);
      onGroupCreated(group);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = allUsers
    .filter(u => u._id !== currentUser._id)
    .filter(u => u.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.username.localeCompare(b.username));

  // Group users by first letter
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const letter = user.username[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(user);
    return acc;
  }, {});

  return (
    <div className="new-chat-overlay" onClick={onClose}>
      <div className="new-chat-sidebar" onClick={e => e.stopPropagation()}>
        <div className="new-chat-header">
          <button className="back-arrow" onClick={step === 1 ? onClose : () => setStep(1)}>←</button>
          <h2>{step === 1 ? 'New chat' : 'New group'}</h2>
        </div>

        {step === 1 ? (
          <>
            <div className="new-chat-search">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search name or number"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="new-chat-list">
              <div className="action-item" onClick={() => setStep(2)}>
                <div className="action-icon green"><span className="icon-member">+</span></div>
                <span>New group</span>
              </div>

              <div className="list-section">
                <p className="section-label">Contacts on WhatsApp</p>
                {Object.keys(groupedUsers).sort().map(letter => (
                  <div key={letter} className="alphabet-section">
                    <p className="alphabet-header">{letter}</p>
                    {groupedUsers[letter].map(u => (
                      <div key={u._id} className="contact-item" onClick={() => toggleMember(u._id)}>
                        <div className="contact-avatar">{u.username[0].toUpperCase()}</div>
                        <div className="contact-info">
                          <span className="contact-name">{u.username}</span>
                          <span className="contact-status">Available</span>
                        </div>
                        <input
                          type="checkbox"
                          className="contact-checkbox"
                          checked={selectedMembers.includes(u._id)}
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {selectedMembers.length > 0 && (
              <button className="next-fab" onClick={() => setStep(2)}>➔</button>
            )}
          </>
        ) : (
          <div className="group-name-step">
            <div className="group-name-input-container">
              <div className="group-avatar-placeholder">📷</div>
              <input
                className="group-name-input"
                type="text"
                placeholder="Group name (optional)"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                autoFocus
              />
            </div>
            <p className="member-count-label">Provide a group name and optional group icon</p>
            
            <div className="selected-members-preview">
               <p className="section-label">Members: {selectedMembers.length}</p>
               <div className="preview-list">
                 {allUsers.filter(u => selectedMembers.includes(u._id)).map(u => (
                   <div key={u._id} className="preview-avatar">
                     {u.username[0].toUpperCase()}
                     <span className="remove-member" onClick={() => toggleMember(u._id)}>✕</span>
                   </div>
                 ))}
               </div>
            </div>

            {error && <p className="modal-error">{error}</p>}

            <button
              className="create-group-fab"
              onClick={handleCreate}
              disabled={loading || !groupName.trim() || selectedMembers.length === 0}
            >
              {loading ? '...' : '✓'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
