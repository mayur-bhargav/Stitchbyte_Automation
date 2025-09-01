# Live Chat Count System

This system implements a client-side live chat count that tracks unread messages without constantly asking the backend for counts.

## How it Works

### 1. ChatContext (`/contexts/ChatContext.tsx`)
- Manages unread counts for each phone number in local state
- Persists counts to localStorage for persistence across sessions
- Provides methods to increment, decrement, and reset counts
- Calculates total unread count across all conversations

### 2. useRealTimeChat Hook (`/hooks/useRealTimeChat.ts`)
- Polls the existing `/chat/contacts` endpoint to detect new messages
- Compares current contacts with previous state to identify new messages
- **Fetches actual message details to verify direction (incoming vs outgoing)**
- **Only increments unread counts for incoming messages**
- Automatically plays notification sound for new incoming messages
- Configurable polling interval (default: 5 seconds)

### 3. Integration Points

#### Chat List Page (`/chats/page.tsx`)
- Uses `useRealTimeChat` hook for live updates
- Displays unread counts from `ChatContext` instead of backend
- Reduces backend polling from every 10 seconds to every 30 seconds for contact metadata

#### Individual Chat Page (`/chats/[phone]/page.tsx`)
- Automatically marks chat as read when user enters the conversation
- Uses faster polling (3 seconds) for the active conversation
- Reloads messages when new messages are detected

#### Navigation (`/components/ClientLayout.tsx`)
- Shows total unread count badge on "Live Chats" navigation item
- Plays notification sound (`/public/notification.wav`) when unread count increases
- Uses preloaded audio element for instant sound playback

## Notification Sound System

The system uses the `notification.wav` file in the `/public` folder for audio notifications:

1. **ClientLayout**: Has a preloaded audio element that plays when unread count increases
2. **Individual Chat**: Uses the same notification.wav for message send confirmations
3. **Real-time Hook**: Programmatically creates and plays audio when new messages are detected
4. **Test Component**: Includes a "Test Sound" button to verify audio functionality

### Audio Integration Points:
- `ClientLayout.tsx`: `<audio ref={audioRef} src="/notification.wav" preload="auto" />`
- `[phone]/page.tsx`: `<audio ref={audioRef} src="/notification.wav" preload="auto" />`
- `useRealTimeChat.ts`: `new Audio('/notification.wav').play()`

## Key Benefits

1. **Reduced Backend Load**: Fewer API calls for unread counts
2. **Real-time Updates**: Immediate UI updates when new messages arrive
3. **Persistent State**: Unread counts survive page refreshes and browser restarts
4. **Configurable**: Easy to adjust polling intervals and behavior
5. **Fallback Safe**: If real-time polling fails, the system degrades gracefully

## Usage

The system is automatically active once the `ChatProvider` is added to the app layout. No additional setup required.

### Manual Testing
A test component is available at `/components/ChatTestComponent.tsx` with the following features:
- **"+ Incoming"**: Adds a test incoming message (should increment count)
- **"+ Outgoing"**: Adds a test outgoing message (should NOT increment count) 
- **"Mark Read"**: Clears unread count for test phone number
- **"Test Sound"**: Plays notification sound manually

## Backend Requirements

The system works with existing endpoints:
- `GET /chat/contacts` - Used to detect new messages
- `GET /chat/messages/{phone}` - Used to load conversation messages

No new backend endpoints are required.

## Future Enhancements

1. **WebSocket Integration**: Replace polling with real-time WebSocket connections
2. **Message Read Receipts**: Track when messages are actually read vs viewed
3. **Push Notifications**: Browser push notifications for new messages
4. **Advanced Filtering**: Unread counts by message type, priority, etc.
