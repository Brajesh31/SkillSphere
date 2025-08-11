import React from 'react';

const ParticipantList = ({ participants, pinnedUser, onPin }) => {
  return (
    <div className="participant-list">
      <h2 className="text-lg font-bold mb-4">Participants</h2>
      <ul>
        {participants.map((participant) => (
          <li key={participant.userId} className="participant-item">
            <span>{participant.name}</span>
            {pinnedUser === participant.userId ? (
              <span className="text-green-500 ml-2">(Pinned)</span>
            ) : (
              <button
                onClick={() => onPin(participant.userId)}
                className="text-blue-500 ml-2"
              >
                Pin
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ParticipantList;
