# 🌐 Network Access Guide

**Date**: May 5, 2026

---

## ✅ YES! You Can Run TaskFlow Over Your Network

TaskFlow can be accessed from any device on your local network (WiFi/LAN).

---

## 🚀 Quick Start

### Method 1: Using npm Script (Recommended)

```bash
npm run dev:network
```

This will:
- Start the development server
- Listen on all network interfaces
- Show you the network URL
- Allow access from any device on your network

### Method 2: Using Vite Directly

```bash
npm run dev -- --host
```

---

## 📱 How to Access

### 1. Start the Server

```bash
npm run dev:network
```

You'll see output like:
```
  VITE v5.4.21  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/
  ➜  press h + enter to show help
```

### 2. Find Your Network IP

The **Network** URL is what you need!
- Example: `http://192.168.1.100:3000/`
- This is your computer's IP address on the network

### 3. Access from Other Devices

On any device connected to the **same WiFi/network**:

**On Phone:**
1. Open browser (Chrome, Safari, etc.)
2. Type: `http://192.168.1.100:3000`
3. Access TaskFlow!

**On Tablet:**
1. Open browser
2. Type: `http://192.168.1.100:3000`
3. Access TaskFlow!

**On Another Computer:**
1. Open browser
2. Type: `http://192.168.1.100:3000`
3. Access TaskFlow!

---

## 🔍 Finding Your IP Address

### Windows:

**Method 1: Command Prompt**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Method 2: PowerShell**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"}
```

**Method 3: Settings**
1. Open Settings
2. Network & Internet
3. WiFi or Ethernet
4. Click your connection
5. Look for "IPv4 address"

### Mac:

**Method 1: Terminal**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Method 2: System Preferences**
1. System Preferences
2. Network
3. Select WiFi or Ethernet
4. See IP address

### Linux:

```bash
hostname -I
```

Or:
```bash
ip addr show
```

---

## 🎯 Network Setup Examples

### Example 1: Home WiFi

```
Your Computer (Server)
IP: 192.168.1.100
Running: npm run dev:network

Your Phone (Client)
Connected to: Same WiFi
Access: http://192.168.1.100:3000

Your Tablet (Client)
Connected to: Same WiFi
Access: http://192.168.1.100:3000
```

### Example 2: Office Network

```
Your Laptop (Server)
IP: 10.0.0.50
Running: npm run dev:network

Colleague's Computer (Client)
Connected to: Same office network
Access: http://10.0.0.50:3000

Your Phone (Client)
Connected to: Same office WiFi
Access: http://10.0.0.50:3000
```

---

## 🔧 Configuration Details

### Vite Config (`vite.config.js`)

```javascript
server: {
  port: 3000,              // Port number
  host: true,              // Listen on all network interfaces
  strictPort: false,       // Try next port if 3000 is busy
}
```

### What This Means:

- **port: 3000** - Server runs on port 3000
- **host: true** - Accessible from network (not just localhost)
- **strictPort: false** - If port 3000 is busy, tries 3001, 3002, etc.

---

## 📱 Mobile Access

### On Your Phone:

1. **Connect to same WiFi** as your computer
2. **Open browser** (Chrome, Safari, Firefox)
3. **Type network URL**: `http://192.168.1.100:3000`
4. **Bookmark it** for easy access
5. **Add to home screen** for PWA experience!

### Install as PWA on Mobile:

**Android (Chrome):**
1. Open TaskFlow in Chrome
2. Tap menu (⋮)
3. "Add to Home screen"
4. Tap "Add"
5. Icon appears on home screen!

**iOS (Safari):**
1. Open TaskFlow in Safari
2. Tap share button (□↑)
3. "Add to Home Screen"
4. Tap "Add"
5. Icon appears on home screen!

---

## 🔒 Security Considerations

### Development Server (Current Setup):

⚠️ **Not secure for production!**
- No HTTPS
- No authentication on network level
- Anyone on your network can access

✅ **Fine for:**
- Local development
- Testing on devices
- Home network
- Trusted office network

❌ **Not for:**
- Public networks
- Production use
- Untrusted environments

### For Production:

Use a proper deployment with:
- HTTPS (SSL/TLS)
- Firewall rules
- Authentication
- Rate limiting

See deployment guide for production setup.

---

## 🛠️ Troubleshooting

### Can't Access from Other Devices?

**1. Check Firewall**

Windows:
```powershell
# Allow port 3000 through firewall
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

Or manually:
1. Windows Security
2. Firewall & network protection
3. Advanced settings
4. Inbound Rules
5. New Rule → Port → TCP → 3000 → Allow

Mac:
1. System Preferences
2. Security & Privacy
3. Firewall
4. Firewall Options
5. Add Vite/Node

**2. Check Network Connection**

- Both devices on same WiFi?
- Same network (not guest network)?
- VPN disabled?

**3. Check Server is Running**

```bash
npm run dev:network
```

Should show Network URL.

**4. Try Different Port**

```bash
npm run dev -- --host --port 3001
```

**5. Check IP Address**

Make sure you're using the correct IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

---

## 🎯 Common Scenarios

### Scenario 1: Test on Your Phone

```bash
# On your computer
npm run dev:network

# Note the Network URL (e.g., http://192.168.1.100:3000)

# On your phone
1. Connect to same WiFi
2. Open browser
3. Go to http://192.168.1.100:3000
4. Test the mobile interface!
```

### Scenario 2: Demo to Team

```bash
# On your laptop
npm run dev:network

# Share the Network URL with team
"Everyone, open http://192.168.1.50:3000"

# Team members access from their devices
- Laptops
- Phones
- Tablets
```

### Scenario 3: Multi-Device Testing

```bash
# Start server
npm run dev:network

# Test on:
- Desktop browser (Chrome, Firefox, Edge)
- Laptop browser
- Phone (iOS Safari)
- Phone (Android Chrome)
- Tablet (iPad)
- Tablet (Android)
```

---

## 📊 Network Commands

### Start Development Server (Network Access)

```bash
npm run dev:network
```

### Start with Custom Port

```bash
npm run dev -- --host --port 8080
```

### Preview Production Build (Network Access)

```bash
npm run build
npm run preview:network
```

### Check What's Using Port 3000

**Windows:**
```powershell
netstat -ano | findstr :3000
```

**Mac/Linux:**
```bash
lsof -i :3000
```

### Kill Process on Port 3000

**Windows:**
```powershell
# Find PID first
netstat -ano | findstr :3000
# Then kill (replace PID with actual number)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
kill -9 $(lsof -t -i:3000)
```

---

## 🌟 Advanced: Custom Domain

### Use Local Domain Name

Instead of IP address, use a custom domain:

**1. Edit Hosts File**

Windows: `C:\Windows\System32\drivers\etc\hosts`
Mac/Linux: `/etc/hosts`

Add:
```
192.168.1.100  taskflow.local
```

**2. Access via Domain**

Now you can use:
```
http://taskflow.local:3000
```

Instead of:
```
http://192.168.1.100:3000
```

---

## 📱 QR Code Access (Bonus)

### Generate QR Code for Easy Access

**1. Install QR Code Generator**

```bash
npm install -g qrcode-terminal
```

**2. Generate QR Code**

```bash
qrcode-terminal "http://192.168.1.100:3000"
```

**3. Scan with Phone**

- Open camera app
- Point at QR code
- Tap notification
- Opens TaskFlow!

---

## 🎉 Summary

### To Run on Network:

1. **Start server:**
   ```bash
   npm run dev:network
   ```

2. **Note the Network URL:**
   ```
   Network: http://192.168.1.100:3000
   ```

3. **Access from any device:**
   - Same WiFi/network
   - Open browser
   - Type the Network URL
   - Done!

### Benefits:

✅ Test on real mobile devices
✅ Demo to team members
✅ Multi-device testing
✅ Access from anywhere on network
✅ Install as PWA on mobile
✅ No internet required (local network)

---

## 📖 Related Commands

```bash
# Development with network access
npm run dev:network

# Development (localhost only)
npm run dev

# Build for production
npm run build

# Preview production build (network access)
npm run preview:network

# Preview production build (localhost only)
npm run preview
```

---

## ⚠️ Important Notes

1. **Same Network Required**
   - All devices must be on the same WiFi/LAN
   - Won't work across different networks

2. **Firewall May Block**
   - Windows Firewall may need configuration
   - Allow port 3000 through firewall

3. **IP May Change**
   - Your computer's IP may change
   - Check IP if connection stops working

4. **Development Only**
   - This is for development/testing
   - Use proper deployment for production

---

**Your TaskFlow can now be accessed from any device on your network!** 🌐📱💻

Test it now:
1. Run `npm run dev:network`
2. Open on your phone
3. Enjoy! ✨
