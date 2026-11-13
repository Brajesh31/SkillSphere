# Realtime Rooms and Socket.IO

## Overview

The backend creates an HTTP server from Express and passes it to `initializeSocket` in `backend/controllers/roomController.js`. Socket.IO is used for room participant updates, room chat broadcasts, hand raising, host actions, and screen-sharing coordination.

The HTTP room records are stored through the Room model. The live participant registry is an in-memory object inside the Socket.IO initializer. These are separate sources of state.

## Event families observed in the server

| Event | Direction / purpose |
|---|---|
| `join-room` | Client asks to join a room with room ID and client-provided identity fields |
| `room-info` | Server sends current participants and active screen share to joining socket |
| `update-participants` | Server broadcasts the current participant list |
| `leave-room` | Client announces that it is leaving |
| `send-message` | Client submits a room message payload |
| `receiveMessage` | Server broadcasts the room message payload |
| `request-screen-share` | Participant requests screen-sharing permission |
| `screen-share-request` | Server notifies the current host |
| `screen-share-request-sent` | Server acknowledges that a request was forwarded |
| `approve-screen-share` | Host approves a participant request |
| `reject-screen-share` | Host rejects a participant request |
| `screen-share-approved` | Server notifies requester of approval |
| `screen-share-rejected` | Server notifies requester of rejection |
| `screen-share-started` | Server broadcasts active screen-share state |
| `screen-share-stopped` | Server broadcasts that screen sharing stopped |
| `raise-hand` | Participant raises a hand |
| `host-action` | Host asks for a supported participant action |
| `you-were-removed` | Server informs a removed participant |
| `new-host` | Server announces host reassignment |
| `meeting-ended` | Server announces that the meeting has ended |

Event payloads are currently defined in the room controller and frontend room page. This table lists event names and intent; it is not a stable public protocol contract.

## Current in-memory behavior

The server keeps an object keyed by room ID. Each room tracks participants and the active screen-share user. A participant entry includes socket ID, user ID, display name, host flag, and local UI state such as raised hand, mute, and video status.

On join, the server updates an existing participant on reconnect or appends a new participant. It then joins the Socket.IO room and emits room information and participant updates. On leave or disconnect, the participant is removed. If the host leaves, the first remaining participant is promoted.

This registry is process-local. Restarting the backend clears it. Multiple backend instances will each have a different participant map unless a shared adapter and shared room-state design are introduced.

## Critical trust-boundary issues

The current Socket.IO setup does not authenticate the connection handshake using the application's JWT. The join event accepts client-provided `userId`, `name`, and `isHost`. Several handlers use client-provided room and user identifiers. Host checks are based on the participant object created from this event.

This means the server must not treat those values as trusted identity or proof of authorization. Before public deployment:
1. Verify the JWT during Socket.IO handshake.
2. Derive user identity from the verified token, never from event payload identity.
3. Load the room from the database and verify membership.
4. Derive host status from the persisted room record.
5. Validate every event payload and enforce per-event authorization.
6. Rate-limit chat and control events.
7. Remove or clean up participant state on disconnect and room deletion.
8. Prevent users from joining arbitrary rooms by guessing identifiers.
9. Ensure screen-share approval and host actions cannot be forged.
10. Add tests for spoofed IDs, unauthorized room joins, and forged host events.

## Realtime messages

The current room chat event broadcasts a payload supplied by the client. A production implementation should validate message length and content, derive sender identity from the socket principal, verify room membership, and persist the message if room history is expected. Client-supplied timestamps and display names should not be treated as authoritative.

## Scaling

For multiple application instances:
- Configure a Socket.IO adapter backed by a shared system such as Redis.
- Define shared room membership and host state.
- Use sticky sessions if required by the deployment topology.
- Store durable room and recording metadata in MongoDB.
- Handle reconnects and server restarts explicitly.
- Ensure uploaded media is stored outside instance-local disks.

## Frontend coordination

The frontend has room-related state in `RoomContext.jsx` and the room page. UI state such as mute, camera, raised hand, participant list, and screen share must be treated as a client presentation layer. The server must independently authorize every action.
