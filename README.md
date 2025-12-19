# 🏏 Cricket Auction App

A comprehensive full-stack web application for managing and conducting professional cricket player auctions. Built with modern web technologies and featuring real-time bidding, role-based access control, and advanced reporting capabilities.

## ✨ Key Features

### 🎯 **Auction Management**
- **Real-time Live Bidding**: Interactive bidding interface with instant updates
- **Auction Controls**: Start/Stop auction with different modes (Normal, Fast-track)
- **Player Status Management**: Track Available, Sold, Retained, and Unsold players
- **Cancel Bidding**: Ability to cancel ongoing bids and return players to available status
- **Undo Operations**: Comprehensive undo system for bids and sales (Super Admin)
- **Smart Captain Detection**: Automatic captain identification and prioritization
- **Enhanced Input Handling**: Improved bidding increment input with validation

### 👥 **Role-Based Access Control**
- **Super Admin**: Full control over auction, undo operations, user management
- **Admin**: Auction management, bidding controls, team operations  
- **Sub-Admin**: Limited administrative functions
- **Spectator**: Read-only access to live auction data

### 🏆 **Team & Player Management**
- **Team Setup**: Configurable team budgets and player limits
- **Player Import**: Bulk upload players via Excel files
- **Captain Assignment**: Assign any player as captain with customizable amount (₹0 to budget)
- **Captain Amount Tracking**: Budget deductions for captain assignments with refund on changes
- **Retained Players**: Support for pre-auction player retention
- **Player Categories**: Organize players by experience, role, and pricing tiers
- **Budget Validation**: Real-time budget checks for captain assignments
- **Visual Indicators**: Crown emoji (👑) displays for captains in Player Management

### 📊 **Advanced Reporting & Analytics**
- **Complete Auction Results**: Comprehensive Excel reports with multiple sheets
- **Team Squad Downloads**: Detailed team compositions with player roles and prices
- **Auction Summary**: Financial overview, statistics, and category analysis
- **Team Finances**: Budget tracking, spending analysis, remaining funds
- **Category Breakdown**: Player distribution and spending by categories
- **Export Options**: Excel (XLSX) and CSV format support

### 🔐 **Security & Performance**
- **Secure Authentication**: JWT-based login system
- **Input Validation**: Comprehensive data validation and sanitization
- **Vulnerability-Free**: Updated to use secure ExcelJS library (0 vulnerabilities)
- **Real-time Updates**: WebSocket integration for live data synchronization
- **Real-time Settings Sync**: Auction settings broadcast instantly to all clients
- **Modern UI Components**: Custom notification system with no browser alert dependencies
- **Enhanced Error Handling**: Graceful error management with user-friendly messages

### 🎨 **Modern User Interface**
- **Professional Design**: Glass-morphism effects with gradient backgrounds
- **Responsive Layout**: Mobile-friendly design for all screen sizes (Mobile/Tablet/Desktop)
- **Typography Hierarchy**: 4-level professional font system
- **Accessibility**: High contrast, proper color schemes, keyboard navigation
- **Interactive Elements**: Smooth animations, hover effects, loading states
- **Modern Notification System**: Custom toast notifications replacing browser alerts
- **Cross-Device Compatibility**: Optimized for phones, tablets, and desktop browsers

## 🆕 Recent Updates & Improvements

### **v2.3.0 - December 2025**
- 👑 **Captain Assignment with Amounts**: Assign any player as team captain with customizable amount deduction
- 💰 **Smart Budget Management**: Captain amounts validated against team budget with refund on reassignment
- 🎨 **Visual Captain Indicators**: Crown emoji (👑) displays next to captain names in Player Management
- 📊 **Dedicated Captain Section**: Purple-themed captain section in Team Squads display
- 🔄 **Real-time Settings Sync**: Live broadcast of auction settings updates to all connected clients
- ⚡ **Instant UI Updates**: Settings changes propagate immediately without page refresh
- 🎯 **Captain Budget Tracking**: Captain amounts included in remaining budget calculations
- 🧹 **Production Code Quality**: Removed all debug logging for clean production deployment

### **v2.2.0 - November 2025**
- ✨ **Searchable Retention Dropdown**: Custom dropdown with search, filter, and clear functionality
- 🎨 **Compact Notifications**: Reduced notification size by 40% for better UX
- 📱 **Enhanced Mobile Support**: Full-width notifications on mobile, optimized touch targets
- 🔍 **Smart Player Search**: Type to filter players by name, category, or role
- 🎯 **Improved Z-Index Management**: Dropdowns properly display above all elements
- ⚡ **Better Event Handling**: Fixed dropdown selection with onMouseDown for reliable clicks
- 🎨 **Purple Theme Integration**: Consistent color scheme across retention features
- 🧹 **Auto-Clear Forms**: Retention inputs clear automatically after successful submission

### **v2.1.0 - November 2025**
- ✨ **Modern Notification System**: Replaced all browser alerts with custom glass-morphism notifications
- 📱 **Full Responsive Design**: Enhanced mobile, tablet, and desktop compatibility
- 🎯 **Improved Captain Detection**: Fixed captain identification with priority-based matching
- ⌨️ **Enhanced Input Handling**: Smooth bidding increment input with proper validation
- 🔄 **Fixed Undo Functionality**: Corrected undo sale button logic and action history tracking
- 🎨 **UI/UX Enhancements**: Modern toast notifications with auto-dismiss and manual controls
- 🔧 **Code Optimization**: Unified notification system across all components
- 📱 **Mobile-First Approach**: Optimized touch targets and responsive layouts
- 🚀 **Performance Improvements**: Reduced bundle size and improved loading times

### **Notification System Features**
- **5 Notification Types**: Success (green), Error (red), Warning (yellow), Info (blue), Confirm (purple)
- **Smart Auto-Dismiss**: Success/Info (3s), Error/Warning (5s), Confirmations (manual)
- **Responsive Design**: Mobile full-width, tablet balanced, desktop right-aligned
- **Glass-Morphism Effects**: Backdrop blur, transparency, smooth animations
- **Accessibility**: ARIA labels, keyboard navigation, high contrast
- **Promise-Based Confirms**: Modern async/await confirmation dialogs

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v16+ recommended)
- **npm** or **yarn**
- **Git** for version control

### 📋 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nikkiller-05/cricket-auction-app.git
   cd cricket-auction-app
   ```

2. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend  
   npm install
   ```

### 🏃‍♂️ Running the Application

#### **Development Mode (Recommended)**

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm start
   ```
   - Server runs on: `http://localhost:5000`
   - API endpoints available at: `http://localhost:5000/api`

2. **Start the Frontend Application:**
   ```bash
   cd frontend
   npm start
   ```
   - Application runs on: `http://localhost:3000`
   - Automatically opens in your default browser

#### **Production Mode**
```bash
# Backend
cd backend
npm run production

# Frontend (build for production)
cd frontend
npm run build
npm install -g serve
serve -s build -l 3000
```

### 🔧 Configuration

#### **Environment Variables**
Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000
```

#### **Default Access**
- **Super Admin**: Access via admin login interface
- **Spectator**: Direct access through viewer dashboard

## 🏗️ Application Architecture & Data Flow

### **System Architecture Diagram**

<div align="center">

<table>
<tr><td align="center" colspan="3">

### 🌐 CLIENT LAYER
</td></tr>
<tr>
<td align="center" width="300">

🏷️ **📱 Mobile App**<br/>
`React Browser`<br/>
<sub>• Spectator View<br/>• Live Bidding<br/>• Real-time Updates</sub>

</td>
<td align="center" width="300">

🏷️ **💻 Desktop Web**<br/>
`React Browser`<br/>
<sub>• Admin Dashboard<br/>• Full Controls<br/>• File Uploads</sub>

</td>
<td align="center" width="300">

🏷️ **📱 Tablet Web**<br/>
`React Browser`<br/>
<sub>• Mixed Usage<br/>• Touch Optimized<br/>• Responsive UI</sub>

</td>
</tr>
<tr><td align="center" colspan="3">

⬇️ **🌐 INTERNET / NETWORK LAYER** ⬇️
</td></tr>
<tr><td align="center" colspan="3">

### 🚀 FRONTEND LAYER (PORT 3000)
</td></tr>
</table>

<table>
<tr>
<td align="center" width="300">

🏷️ **📍 Router Layer**<br/>
<sub>• HomePage (/)<br/>• AuctionSetup<br/>• UnifiedDashboard<br/>• Route Guards</sub>

</td>
<td align="center" width="300">

🏷️ **🔔 Notification System**<br/>
<sub>• Custom Toasts<br/>• Glass-morphism<br/>• Auto-dismiss<br/>• Confirm Dialogs</sub>

</td>
<td align="center" width="300">

🏷️ **🎨 UI Components**<br/>
<sub>• PlayersList<br/>• TeamsDisplay<br/>• StatsDisplay<br/>• AuctionControls</sub>

</td>
</tr>
<tr>
<td align="center" width="300">

🏷️ **🔐 Auth Context**<br/>
<sub>• JWT Storage<br/>• Role Management<br/>• Login States</sub>

</td>
<td align="center" width="300">

🏷️ **📡 Socket Client**<br/>
<sub>• Real-time Events<br/>• Bidding Updates<br/>• Settings Sync<br/>• Live Statistics<br/>• Connection Mgmt</sub>

</td>
<td align="center" width="300">

🏷️ **🌐 HTTP Client**<br/>
<sub>• Axios Requests<br/>• File Uploads<br/>• API Calls<br/>• Error Handling</sub>

</td>
</tr>
<tr><td align="center" colspan="3">

⬇️ **🔌 REAL-TIME + REST API** ⬇️
</td></tr>
<tr><td align="center" colspan="3">

### ⚡ BACKEND LAYER (PORT 5000)
</td></tr>
</table>

<table>
<tr>
<td align="center" width="300">

🏷️ **🌐 HTTP Server**<br/>
<sub>• Express Routes<br/>• Middleware<br/>• CORS Config<br/>• Error Handling</sub>

</td>
<td align="center" width="300">

🏷️ **🔌 Socket.io Server**<br/>
<sub>• Real-time Events<br/>• Broadcast System<br/>• Settings Updates<br/>• Connection Mgmt<br/>• Room Management</sub>

</td>
<td align="center" width="300">

🏷️ **🔐 Authentication**<br/>
<sub>• JWT Validation<br/>• Role-based Access<br/>• Secure Headers<br/>• Login Logic</sub>

</td>
</tr>
<tr>
<td align="center" width="300">

🏷️ **📊 Business Logic**<br/>
<sub>• Bidding Rules<br/>• Category Parser<br/>• Undo System<br/>• Statistics</sub>

</td>
<td align="center" width="300">

🏷️ **💾 Data Service**<br/>
<sub>• In-Memory Store<br/>• Player Data<br/>• Team Management<br/>• Action History</sub>

</td>
<td align="center" width="300">

🏷️ **📁 File Processing**<br/>
<sub>• Excel Parser<br/>• File Validation<br/>• Report Generator<br/>• Secure Upload</sub>

</td>
</tr>
<tr><td align="center" colspan="3">

⬇️ **📁 FILE SYSTEM & MEMORY STORAGE** ⬇️
</td></tr>
<tr><td align="center" colspan="3">

### 💾 DATA STORAGE LAYER
</td></tr>
</table>

<table>
<tr><td align="center" colspan="3">

🏷️ **� AUCTION DATA STORE** `Ultra-Fast Performance`<br/>
<sub>`players: [{id, name, role, category, status, basePrice, team}, ...]`<br/>
`teams: [{id, name, budget, players, captain, captainAmount}, ...]`<br/>
`currentBid: {playerId, teamId, amount, history, timestamp}`</sub>

</td></tr>
<tr>
<td align="center" width="300">

🏷️ **📈 Statistics Data**<br/>
<sub>• Total Sales<br/>• Highest Bids<br/>• Category Stats<br/>• Team Finances</sub>

</td>
<td align="center" width="300">

🏷️ **📜 Action History**<br/>
<sub>• Undo Operations<br/>• Bid History<br/>• Player Changes<br/>• Timestamps</sub>

</td>
<td align="center" width="300">

🏷️ **📁 Temporary Files**<br/>
<sub>• Uploaded Excels<br/>• Generated Reports<br/>• Export Files<br/>• Temp Storage</sub>

</td>
</tr>
</table>

</div>

### **🔄 Data Flow & Connection Patterns**

#### **1. Initial Connection Flow:**
```
📱 Client Browser
    │ 1. Load React App
    ▼
🌐 HTTP Request (Port 3000)
    │ 2. Get Static Files  
    ▼
⚡ Express Server (Port 5000)
    │ 3. Serve Frontend Bundle
    ▼
🔌 Socket.io Connection
    │ 4. Establish WebSocket
    ▼
💾 Data Service
    │ 5. Send Initial Auction Data
    ▼
📱 Client State Update
```

#### **2. Real-time Bidding Flow:**
```
👤 Admin Places Bid
    │ 1. UI Action
    ▼
🌐 HTTP POST /api/auction/bidding/place
    │ 2. API Request with bid data
    ▼
🔐 JWT Authentication
    │ 3. Verify admin role
    ▼
📊 Bidding Rules Engine
    │ 4. Validate increment rules
    ▼
💾 Update In-Memory Data
    │ 5. Store bid & update player
    ▼
🔌 Socket.io Broadcast
    │ 6. Emit 'bidUpdated' event
    ▼
📱 All Connected Clients
    │ 7. Real-time UI updates
    ▼
🎨 Live Statistics Refresh
```

#### **3. File Upload & Processing Flow:**
```
👤 Admin Uploads Excel
    │ 1. File Selection
    ▼
📁 Multer Middleware
    │ 2. Handle file upload
    ▼
🛡️ File Validation
    │ 3. Check format & size
    ▼
📊 ExcelJS Parser
    │ 4. Parse player data
    ▼
🏷️ Category Detection
    │ 5. Auto-categorize players
    ▼
💾 Store Player Data
    │ 6. Update auction data
    ▼
🔌 Broadcast Update
    │ 7. Notify all clients
    ▼
🎯 Initialize Teams
    │ 8. Create team structure
```

### **📡 Communication Protocols**

#### **HTTP REST API (Request/Response):**
- **Authentication**: JWT token-based
- **File Uploads**: Multipart form data
- **Downloads**: Streaming Excel files
- **Configuration**: Auction setup & settings

#### **WebSocket (Real-time Bidirectional):**
- **Live Bidding**: Instant bid updates
- **Player Status**: Sold/Unsold notifications  
- **Statistics**: Live auction analytics
- **System Events**: Reset, undo operations

### **🔐 Security & Performance Architecture**

#### **Security Layers:**
```
🛡️ Input Validation → 🔐 JWT Auth → 👤 Role Checks → 🚫 CORS Protection
```

#### **Performance Optimizations:**
```
⚡ In-Memory Data → 🔄 Socket Pooling → 📦 Code Splitting → 🎨 React.memo
```

### **📱 Application Structure**

### **Frontend (React.js)**
- **Modern React Hooks**: useState, useEffect, custom hooks
- **Real-time Communication**: Socket.io client integration  
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router for navigation
- **State Management**: Context API and local state
- **HTTP Client**: Axios for API communication
- **Custom Notification System**: Modern toast notifications with glass-morphism design
- **Responsive Components**: Mobile-first design approach with breakpoint optimization

### **Backend (Node.js/Express)**
- **RESTful API**: Comprehensive endpoint structure
- **Real-time Events**: Socket.io server implementation
- **Security**: JWT authentication, input validation
- **File Processing**: Secure Excel parsing and generation (ExcelJS)
- **Error Handling**: Centralized error management
- **Data Persistence**: JSON-based data storage with action history
- **Category Parser**: Advanced logic for player role detection and categorization
- **Bidding Rules Engine**: Configurable increment rules and validation

## 🎮 How to Use

### **For Administrators:**

1. **Setup Auction**:
   - Upload player data via Excel file
   - Configure team budgets and player limits
   - Set auction parameters

2. **Manage Teams**:
   - Add/edit team information
   - Assign captains with customizable amounts (₹0 to team budget)
   - Captain amounts automatically deducted from team budgets
   - Reassign captains with automatic refund of previous amount
   - Manage retained players
   - Monitor team budgets and remaining funds

3. **Conduct Auction**:
   - Start auction and control bidding
   - Place bids for teams
   - Mark players as sold/unsold
   - Use cancel/undo features as needed

4. **Generate Reports**:
   - Download complete results
   - Export team squads
   - Generate financial summaries

### **For Spectators:**
- **Live Viewing**: Watch auction progress in real-time
- **Team Tracking**: Monitor team compositions and spending
- **Download Access**: Export available reports and summaries

## 📋 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### **Auction Management**
- `GET /api/auction/data` - Get auction status and data
- `GET /api/auction/settings` - Get auction settings
- `POST /api/auction/settings` - Update auction settings (broadcasts real-time)
- `POST /api/auction/start` - Start auction
- `POST /api/auction/stop` - Stop auction
- `POST /api/auction/upload-players` - Upload player data

### **Bidding Operations**
- `POST /api/auction/bidding/place` - Place bid for team
- `POST /api/auction/bidding/cancel` - Cancel current bidding
- `POST /api/auction/bidding/undo` - Undo last operation

### **Team Management**
- `GET /api/teams` - Get all teams
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team details
- `POST /api/teams/:teamId/captain` - Assign captain with amount
- `POST /api/teams/:teamId/retained` - Add retained player

### **Downloads & Reports**
- `GET /api/download-results` - Complete auction results
- `GET /api/download-team-squads` - Team squad reports  
- `GET /api/download-auction-summary` - Financial summaries

## 🛠️ Technology Stack

### **Frontend**
- ⚛️ **React.js** - Component-based UI library
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🔌 **Socket.io Client** - Real-time communication
- 📡 **Axios** - HTTP request library
- 🧭 **React Router** - Client-side routing

### **Backend**  
- 🟢 **Node.js** - JavaScript runtime
- 🚂 **Express.js** - Web application framework
- 🔌 **Socket.io** - Real-time bidirectional communication
- 📊 **ExcelJS** - Excel file processing (secure)
- 🔐 **JWT** - JSON Web Token authentication

## 🚀 Deployment Options

### **Frontend Deployment (Free Options)**
- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop build folder
- **GitHub Pages**: `npm run build` + push to gh-pages

### **Backend Deployment (Free Options)**
- **Render**: Connect GitHub repo
- **Railway**: Deploy with Git integration  
- **Cyclic**: Serverless deployment
- **Glitch**: Real-time collaborative deployment

### **Full-Stack Deployment**
- **Heroku**: Deploy both frontend and backend
- **DigitalOcean App Platform**: Multi-component deployment
- **AWS/Google Cloud**: Container-based deployment

## 🔒 Security Features

- ✅ **Input Validation**: All user inputs validated and sanitized
- ✅ **Secure Dependencies**: Updated to vulnerability-free packages
- ✅ **Role-Based Access**: Proper authorization for all operations
- ✅ **Data Integrity**: Comprehensive error handling and validation
- ✅ **Secure File Processing**: Safe Excel parsing and generation

## 📈 Performance Optimizations

- ⚡ **Real-time Updates**: Efficient WebSocket communication
- 🔄 **Optimized Rendering**: React best practices and memoization
- 📦 **Code Splitting**: Lazy loading for better performance
- 🗜️ **Asset Optimization**: Compressed images and minified code
- 💾 **Caching Strategy**: Proper HTTP caching headers
- 🎨 **Modern UI Components**: Custom notification system with minimal overhead
- 📱 **Responsive Optimization**: Efficient CSS with Tailwind utilities

## 🌐 Browser Compatibility

### **Fully Supported Browsers**
- ✅ **Chrome** 90+ (Desktop & Mobile)
- ✅ **Firefox** 88+ (Desktop & Mobile)  
- ✅ **Safari** 14+ (Desktop & Mobile)
- ✅ **Edge** 90+ (Desktop & Mobile)
- ✅ **Samsung Internet** 14+
- ✅ **Opera** 76+

### **Device Support**
- 📱 **Mobile**: iOS 14+, Android 8+
- 📱 **Tablet**: iPad OS 14+, Android Tablets
- 💻 **Desktop**: Windows 10+, macOS 11+, Linux (Ubuntu 20+)
- 🖥️ **Screen Sizes**: 320px - 3840px (4K support)

## ✅ Quality Assurance

### **Testing Coverage**
- ✅ **Cross-browser Testing**: Verified on all major browsers
- ✅ **Responsive Testing**: Tested on various screen sizes and devices
- ✅ **Notification System**: All alert/confirm flows tested and validated
- ✅ **Captain Detection**: Verified with various role description formats
- ✅ **Input Validation**: Tested with edge cases and invalid data
- ✅ **Real-time Updates**: Socket.io functionality tested across multiple clients

### **Code Quality**
- ✅ **ESLint**: Code linting and style consistency
- ✅ **Security Audit**: npm audit with 0 vulnerabilities
- ✅ **Performance**: Lighthouse scores optimized
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Mobile Performance**: Optimized for 3G networks

## 🤝 Contributing

### **Development Guidelines**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Follow existing code style and patterns
4. Test across multiple browsers and devices
5. Update documentation if needed
6. Commit changes: `git commit -m 'Add feature description'`
7. Push to branch: `git push origin feature-name`
8. Open a Pull Request with detailed description

### **Code Standards**
- Use meaningful variable and function names
- Follow React hooks best practices
- Maintain responsive design principles
- Use the unified notification system for user feedback
- Include proper error handling and validation

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## � Troubleshooting

### **Common Issues & Solutions**

#### **Backend Server Won't Start**
```bash
# Check if port 5000 is available
netstat -an | grep 5000

# Try a different port
PORT=5001 npm start
```

#### **Frontend Build Issues**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### **Notifications Not Appearing**
- Ensure NotificationProvider is wrapped around App component
- Check browser console for JavaScript errors
- Verify components are importing useNotification correctly

#### **Captain Detection Issues**
- Ensure player data includes proper role descriptions
- Check that captain roles contain "captain" keyword
- Verify Excel file format matches expected structure

#### **Mobile Display Issues**
- Clear browser cache and cookies
- Check viewport meta tag is present
- Ensure Tailwind CSS is properly loaded

## �🐛 Support & Issues

- **Bug Reports**: Open an issue on GitHub with detailed reproduction steps
- **Feature Requests**: Discuss in GitHub Issues with use case details
- **Documentation**: Check the wiki for detailed guides and API documentation
- **Community Support**: Join discussions for help and best practices

---

**Made with ❤️ for cricket auction enthusiasts**
