# AEGIS Chatbot - Development Tasks

## Project Location
```
C:\Users\AlexGomez\OneDrive - Safety Excellence Group\Desktop\seg-website
```

## Files to Modify
- `js/aegis-chatbot.js` - Main chatbot logic
- `css/aegis-chatbot.css` - Styling
- `server/index.js` - Backend + system prompt

---

## TASK 0: Chat Widget Welcome Screen (HIGH PRIORITY)

### Before the disclaimer, show a branded welcome screen:

**Single centered card with:**
```
S.E.G. HI + AEGIS AI = SAFE • FAST • PRECISE
```

- Card should be centered in the chat window
- "SAFE • FAST • PRECISE" in gold (#FFCF00)
- Clean, professional look matching SEG branding
- "Start Chat" button below that leads to disclaimer

**Flow:**
1. User opens chat → sees welcome card
2. User clicks "Start Chat" 
3. Disclaimer appears
4. After accepting disclaimer → chat begins

---

## TASK 1: Chat Widget Appearance & Behavior

### 1A: Minimized State with Intro
When minimized, show a small preview bubble next to the chat button:
- Text: "Hi! 👋 Need safety help?" or similar
- Should appear after 3 seconds on page load
- Dismiss option (X button)
- Clicking opens the full chat

### 1B: Logo Customization
- Replace the current AEGIS shield icon with a customizable logo
- Add a CONFIG option: `logoUrl: '/path/to/aegis-logo.png'`
- Fallback to current SVG if no logo provided
- Logo should appear in:
  - Chat header
  - Minimized bubble
  - Bot message avatars

### 1C: Smooth Entry Animation
- Chat widget should slide up smoothly when opened
- Add subtle bounce or fade effect
- Minimized state should pulse gently to draw attention (optional, can be toggled)

---

## TASK 2: Calendar Opens in New Window/Modal

### Current Problem
Calendar embedded in chat is cramped and hard to use.

### Solution
Instead of embedding iframe in chat messages:
1. Open a centered modal overlay (like the booking modal on the main site)
2. OR open in new browser tab/window

### Implementation
```javascript
function showBookingCalendar() {
    // Option A: Modal overlay
    // Create full-screen modal with iframe
    
    // Option B: New window
    window.open('https://api.leadconnectorhq.com/widget/booking/56IkA4NNqXU4MQAnpmAh', 
                'SEG Discovery Call', 
                'width=600,height=700,scrollbars=yes');
}
```

### Recommendation
Use Modal overlay (Option A) - keeps user on page, more professional.

---

## TASK 3: Expand Knowledge Base (System Prompt)

Update the system prompt in `server/index.js` to include expertise in:

### OSHA Standards
- **29 CFR 1910** - OSHA General Industry Requirements (excluding 1910.1096 Ionizing Radiation)
- **29 CFR 1926** - OSHA Construction Requirements
- **10 CFR 851** - DOE Safety and Health Requirements (DOE PROJECTS ONLY - ask if DOE project)

### State OSHA (when applicable)
- **Cal-OSHA Title 8, Subchapter 4** - Construction Safety Orders (Sections 1500-1962)
- Note: Bot should ask what state the project is in when relevant

### Industrial Hygiene
- **ACGIH TLVs** - Threshold Limit Values for Chemical Substances and Physical Agents
- Note: ACGIH TLVs used when they provide higher protection than OSHA PELs

### ANSI Standards
- **ANSI Z88.2** - Respiratory Protection
- **ANSI Z136.1** - Safe Use of Lasers
- **ANSI Z49.1** - Safety in Welding, Cutting and Allied Processes

### NFPA Standards
- **NFPA 70** - National Electric Code (NEC)
- **NFPA 70E** - Electrical Safety in the Workplace

### ASME Standards
- **ASME B30** - Safety Standard for Cableways, Cranes, Derricks, Hoists, Hooks, Jacks, and Slings

### Existing (keep these)
- SEMI S2/S8 - Semiconductor equipment safety
- ANSI/ASSP Z10 - Occupational Health and Safety Management Systems

### System Prompt Rules for Standards
1. Always cite the specific standard when answering (e.g., "Per 29 CFR 1926.502...")
2. Never give definitive compliance advice - use "The standard requires..." or "Per [standard]..."
3. For state-specific questions, ask which state first
4. For DOE projects, confirm it's DOE before citing 10 CFR 851
5. When ACGIH TLV differs from OSHA PEL, mention both and note which is more protective

---

## TASK 4: World-Class Enhancements

### 4A: Smart Qualification Detection
Bot should naturally detect qualification info from conversation:
- If user mentions "semiconductor" → auto-fill industry
- If user mentions "next month" → understand timeline
- Track what's been gathered, what's still needed

### 4B: Typing Indicators & Read Receipts
- Show "AEGIS is typing..." with animated dots
- Slight delay before responses (feels more natural)
- Already partially implemented - verify it's working

### 4C: Quick Reply Suggestions
After each bot response, show 2-3 contextual quick replies:
- After services overview → "Tell me about staffing" | "What industries?" | "Book a call"
- After compliance question → "Ask another question" | "Talk to an expert" | "Book a call"

### 4D: Conversation Memory Within Session
- Remember what user already told you
- Don't re-ask questions they've answered
- Reference earlier parts of conversation

### 4E: Proactive Engagement
After 30-60 seconds of inactivity:
- "Still there? Let me know if you have questions!"
- Only trigger once per session

### 4F: Mobile Optimization
- Full-screen chat on mobile
- Touch-friendly buttons (min 44px tap targets)
- Smooth keyboard handling

### 4G: Analytics Hooks (prep for future)
Add event tracking hooks for:
- Chat opened
- Disclaimer accepted
- Qualification form completed
- Calendar opened
- Messages sent

### 4H: Error Handling & Fallbacks
- If API fails, show friendly error + offer phone/email
- If user is frustrated (detects keywords), offer human handoff
- Rate limiting awareness

### 4I: Escape Hatch to Human
Always provide option to:
- Call: 469.988.4777
- Email: info@safety-excellence.com
- Show this if user seems stuck or frustrated

### 4J: Rich Message Types
Support for:
- Links (clickable)
- Bold/italic text
- Simple bullet lists
- Maybe: images/attachments in future

---

## Priority Order

1. **HIGH** - Task 0 (Welcome screen with feature cards + SAFE.FAST.PRECISE)
2. **HIGH** - Task 2 (Calendar modal) - Current UX is broken
3. **HIGH** - Task 3 (Knowledge base) - Core value prop
4. **MEDIUM** - Task 1 (Widget appearance) - Polish
5. **MEDIUM** - Task 4A-4C (Smart features) - Differentiation
6. **LOW** - Task 4D-4J (Advanced) - Future iteration

---

## Testing Checklist

After changes, verify:
- [ ] Disclaimer shows on first open (each session)
- [ ] Chat opens/closes smoothly
- [ ] Quick replies work
- [ ] Qualification form displays
- [ ] Calendar opens (modal or new window)
- [ ] Bot responses are concise
- [ ] Bot cites standards correctly
- [ ] Mobile view works
- [ ] Server runs without errors

---

## Notes for Claude Code

- Server must be restarted after `index.js` changes: `Ctrl+C` then `node index.js`
- Test in browser at `http://localhost:3001` using `aegis-demo.html`
- User cannot provide visual feedback until morning - focus on code quality
- Keep responses SHORT - this is a sales tool, not an encyclopedia
- When in doubt, push toward booking a discovery call
