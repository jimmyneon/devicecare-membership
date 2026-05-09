# Apple Wallet & Google Wallet Integration Guide

## ✅ What's Implemented

### **Membership Card Features:**
- ✅ Beautiful card design with gradient background
- ✅ QR code for in-store scanning
- ✅ Member name, balance, and status
- ✅ Fullscreen mode
- ✅ Download as image
- ✅ **Apple Wallet button** (ready for integration)
- ✅ **Google Wallet button** (ready for integration)
- ✅ **Image compression** (photos ~100-200 KB each)

### **Storage Optimization:**
- ✅ Auto-compress photos to 800x800px max
- ✅ 80% JPEG quality
- ✅ **Result:** ~5,000-10,000 members per 1 GB
- ✅ Supabase Free Tier: 1 GB = plenty of space!

---

## 📱 Apple Wallet Integration

### **Requirements:**
1. **Apple Developer Account** ($99/year)
2. **Pass Type ID Certificate**
3. **Team ID**
4. **Signing Certificate**

### **Setup Steps:**

#### **1. Create Pass Type ID**
1. Go to https://developer.apple.com/account
2. Certificates, Identifiers & Profiles → Identifiers
3. Click "+" → Pass Type IDs
4. Description: "DeviceCare Membership"
5. Identifier: `pass.com.nfdrepairs.devicecare`
6. Register

#### **2. Create Certificate**
1. In Pass Type IDs, click your pass
2. Click "Create Certificate"
3. Upload CSR (create with Keychain Access on Mac)
4. Download certificate
5. Install in Keychain

#### **3. Install Package**
```bash
npm install passkit-generator
```

#### **4. Add Environment Variables**
```bash
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_PASS_TYPE_ID=pass.com.nfdrepairs.devicecare
APPLE_WWDR_CERT=path/to/wwdr.pem
APPLE_SIGNER_CERT=path/to/signerCert.pem
APPLE_SIGNER_KEY=path/to/signerKey.pem
```

#### **5. Uncomment Code**
The implementation is ready in `/app/api/wallet/apple/route.ts` - just uncomment and configure!

---

## 📱 Google Wallet Integration

### **Requirements:**
1. **Google Cloud Project** (free)
2. **Google Wallet API enabled**
3. **Service Account**
4. **Issuer ID**

### **Setup Steps:**

#### **1. Create Google Cloud Project**
1. Go to https://console.cloud.google.com
2. Create new project: "DeviceCare Membership"
3. Enable Google Wallet API

#### **2. Create Service Account**
1. IAM & Admin → Service Accounts
2. Create service account
3. Grant "Google Wallet API Admin" role
4. Create JSON key
5. Download credentials

#### **3. Get Issuer ID**
1. Go to https://pay.google.com/business/console
2. Google Wallet API → Issuer
3. Copy your Issuer ID

#### **4. Install Package**
```bash
npm install @google-pay/passes google-auth-library jsonwebtoken
```

#### **5. Add Environment Variables**
```bash
GOOGLE_WALLET_ISSUER_ID=3388000000012345678
GOOGLE_WALLET_CREDENTIALS='{"type":"service_account",...}'
```

#### **6. Uncomment Code**
The implementation is ready in `/app/api/wallet/google/route.ts` - just uncomment and configure!

---

## 🎨 Pass Design

### **Apple Wallet Pass:**
```
┌─────────────────────────┐
│ DeviceCare Membership   │
│                         │
│   [QR CODE]             │
│                         │
│ John Smith              │
│ Balance: £25.00         │
│ Status: ACTIVE          │
│                         │
│ Member ID: ABC12345     │
└─────────────────────────┘
```

### **Google Wallet Pass:**
```
┌─────────────────────────┐
│ 🌲 DeviceCare           │
│                         │
│ John Smith              │
│                         │
│ Credit Balance          │
│ £25.00                  │
│                         │
│ Status: ACTIVE          │
│                         │
│   [QR CODE]             │
└─────────────────────────┘
```

---

## 🔄 How It Works

### **User Flow:**

1. **User completes profile** → Can access membership card
2. **Click "Add to Apple Wallet"** → Downloads .pkpass file
3. **Opens in Wallet app** → Card added automatically
4. **Or "Add to Google Wallet"** → Opens Google Pay
5. **Card saved** → Available offline
6. **In-store** → Shows QR code from wallet
7. **Staff scans** → Instant member lookup

### **QR Code Content:**
```
https://yourdomain.com/staff/member/[member-id]
```

Staff scan → Opens member profile → See balance, history, etc.

---

## 💰 Cost Analysis

### **Supabase Storage (Free Tier):**
- **Limit:** 1 GB
- **Photo size:** ~150 KB (after compression)
- **Capacity:** ~6,800 photos
- **Conclusion:** ✅ More than enough!

### **Upgrade if needed:**
- **Pro Plan:** $25/month = 100 GB storage
- **That's:** ~680,000 photos
- **You won't need this!**

### **Apple Developer:**
- **Cost:** $99/year
- **Worth it?** Yes, if you want Apple Wallet

### **Google Wallet:**
- **Cost:** FREE
- **Worth it?** Absolutely!

---

## 🚀 Quick Start (For Now)

**Without wallet integration, users can:**
1. ✅ View beautiful membership card
2. ✅ Download as image
3. ✅ Add to phone home screen
4. ✅ Show QR code in-store
5. ✅ Fullscreen mode

**This works perfectly until you set up wallet integration!**

---

## 📝 Implementation Priority

### **Phase 1: Current (Working Now)**
- ✅ Membership card design
- ✅ QR code generation
- ✅ Download functionality
- ✅ Image compression

### **Phase 2: Google Wallet (Recommended First)**
- Free to implement
- Easier setup than Apple
- Works on Android (larger market share in UK)

### **Phase 3: Apple Wallet**
- Requires paid developer account
- More complex setup
- Premium feature for iOS users

---

## 🎯 Recommendation

**Start without wallet integration:**
1. Test the membership system
2. Get real users
3. See if they request wallet integration
4. Then implement Google Wallet (free)
5. Later add Apple Wallet if demand is high

**The download image feature works great for now!** Users can:
- Save to photos
- Add to home screen
- Screenshot and use

**Most users will be happy with this!** 🎉

---

## 📚 Resources

- [Apple Wallet Developer Guide](https://developer.apple.com/wallet/)
- [Google Wallet API Docs](https://developers.google.com/wallet)
- [passkit-generator](https://github.com/alexandercerutti/passkit-generator)
- [Google Pay Passes](https://www.npmjs.com/package/@google-pay/passes)
