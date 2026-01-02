# 🎨 Ink War - Multiplayer Paint Battle

A real-time multiplayer painting game where 2-6 players compete to cover the most canvas area with their color!

## 🎮 Game Features

- **Multiplayer**: 2-6 players can join from different devices
- **Real-time Sync**: Uses GunDB for peer-to-peer synchronization
- **Simple Controls**: Just 2 buttons - Turn Left and Turn Right
- **Mobile-First**: Optimized for mobile devices with touch controls
- **Competitive**: 2-minute battles to paint the most area
- **Cross-Device**: Players join via room codes from any device

## 🕹️ How to Play

### Starting a Game

1. **Create Room**: One player creates a room and gets a 6-character room code
2. **Share Code**: Share the room code with other players
3. **Join Room**: Other players enter the room code and their name
4. **Start Game**: Host starts the game when 2-6 players are ready

### Controls

- **Mobile**: Use the on-screen "Turn Left ↺" and "Turn Right ↻" buttons
- **Desktop**: Use Arrow Left/Right keys or A/D keys

### Gameplay

- Your brush **moves forward automatically**
- Use the turn buttons to rotate your direction (90° turns)
- Paint as much of the canvas as possible with your color
- The brush leaves a trail of paint wherever it moves
- Game lasts 2 minutes
- Player with the highest percentage of painted area wins!

### Strategy Tips

- Plan your path to maximize coverage
- Try to paint over opponent colors to steal their territory
- Avoid painting over your own color (wasted movement)
- Use the edges - the canvas wraps around!

## 🚀 How to Run

### Option 1: Direct Browser (Recommended)

Simply open `index.html` in any modern web browser. The game uses CDN-hosted GunDB, so no installation needed!

```bash
# On Linux/Mac
open index.html

# On Windows
start index.html

# Or just double-click the index.html file
```

### Option 2: Local Server

For better performance, you can run a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 🌐 Playing Across Devices

1. **Same Network**: All players can connect from devices on the same WiFi
2. **Different Networks**: Works across the internet via GunDB relay peers
3. **Room Codes**: Each game session has a unique 6-character code
4. **No Server Needed**: Peer-to-peer connection via GunDB

## 🎨 Player Colors

The game supports up to 6 players with distinct colors:
1. 🔴 Red
2. 🔵 Blue
3. 🟢 Green
4. 🟡 Yellow
5. 🟣 Purple
6. 🟠 Orange

## 🛠️ Technical Details

### Technologies Used

- **HTML5 Canvas**: For game rendering
- **Vanilla JavaScript**: Game logic and controls
- **CSS3**: Responsive styling with gradients and animations
- **GunDB**: Real-time peer-to-peer data synchronization

### Architecture

- **Grid-based Canvas**: 360x640px divided into 4px cells
- **Real-time Sync**: Player positions and painted cells synced via GunDB
- **Optimized Updates**: Throttled grid synchronization to reduce network load
- **Responsive Design**: Works on mobile and desktop browsers

### Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Optimization

- Touch-optimized controls with large buttons
- Portrait orientation (360x640px canvas)
- Prevents accidental zoom and scroll
- Responsive UI that adapts to screen size

## 🎯 Game Configuration

You can modify these settings in `game.js`:

```javascript
const CONFIG = {
    CANVAS_WIDTH: 360,      // Canvas width in pixels
    CANVAS_HEIGHT: 640,     // Canvas height in pixels
    CELL_SIZE: 4,           // Size of each paintable cell
    GAME_DURATION: 120,     // Game duration in seconds (2 minutes)
    MAX_PLAYERS: 6,         // Maximum number of players
    COLORS: [...]           // Player color palette
};
```

## 🐛 Troubleshooting

### Players can't connect
- Check that all players are using the correct room code
- Ensure internet connection is stable
- Try refreshing the page and creating a new room

### Game is laggy
- Close other browser tabs
- Check internet connection speed
- Reduce number of players if possible

### Controls not working
- Make sure the game has started (timer is counting down)
- Check that you're clicking/tapping the buttons properly
- Try using keyboard controls on desktop (Arrow keys or A/D)

## 📄 License

This project is open source and free to use for educational and personal purposes.

## 🎉 Credits

Built with ❤️ using GunDB for real-time multiplayer synchronization.

---

**Enjoy the Ink War! May the best painter win! 🎨🏆**
