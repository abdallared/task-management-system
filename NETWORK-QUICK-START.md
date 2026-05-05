# 🌐 Network Access - Quick Start

---

## ✅ YES! You Can Run TaskFlow Over Your Network

---

## 🚀 3 Simple Steps

### 1. Start the Server

```bash
npm run dev:network
```

### 2. Note the Network URL

You'll see:
```
➜  Network: http://192.168.1.100:3000/
```

### 3. Access from Any Device

On your phone, tablet, or another computer:
- Connect to **same WiFi**
- Open browser
- Type: `http://192.168.1.100:3000`
- Done! ✨

---

## 📱 Quick Access

### On Your Phone:
1. Connect to same WiFi as your computer
2. Open browser
3. Go to: `http://YOUR_IP:3000`
4. Bookmark it!
5. Add to home screen for PWA!

### On Another Computer:
1. Connect to same network
2. Open browser
3. Go to: `http://YOUR_IP:3000`
4. Use TaskFlow!

---

## 🔍 Find Your IP Address

### Windows:
```bash
ipconfig
```
Look for "IPv4 Address"

### Mac:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Linux:
```bash
hostname -I
```

---

## 🛠️ Troubleshooting

### Can't Connect?

**1. Check Firewall**
- Windows: Allow port 3000 through Windows Firewall
- Mac: Check Security & Privacy settings

**2. Check Network**
- Both devices on same WiFi?
- Not on guest network?

**3. Check Server**
- Is `npm run dev:network` running?
- See the Network URL in terminal?

---

## 📋 Commands

```bash
# Start with network access
npm run dev:network

# Start localhost only
npm run dev

# Build for production
npm run build

# Preview build with network access
npm run preview:network
```

---

## 🎯 Example

```
Your Computer:
- IP: 192.168.1.100
- Running: npm run dev:network

Your Phone:
- WiFi: Same network
- Browser: http://192.168.1.100:3000
- Result: TaskFlow opens! ✅
```

---

## ⚠️ Important

- ✅ Works on local network (WiFi/LAN)
- ✅ All devices must be on same network
- ✅ Great for testing and demos
- ❌ Not for production use
- ❌ No HTTPS (development only)

---

## 🎉 That's It!

**Your TaskFlow is now accessible from any device on your network!**

For detailed guide, see: `NETWORK-ACCESS-GUIDE.md`

---

**Quick Test:**
1. Run: `npm run dev:network`
2. Open on phone: `http://YOUR_IP:3000`
3. Enjoy! 📱✨
