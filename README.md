# 🏏 Cricket Auction App

A comprehensive full-stack web application for managing and conducting professional cricket player auctions. Built with modern web technologies and featuring real-time bidding, role-based access control, and advanced reporting capabilities.

## ✨ Key Features

### 🎯 **Auction Management**
- **Real-time Live Bidding**: Interactive bidding interface with instant updates
- **Auction Controls**: Start/Stop auction with different modes (Normal, Fast-track)
- **Player Status Management**: Track Available, Sold, Retained, and Unsold players
- **Cancel Bidding**: Ability to cancel ongoing bids and return players to available status
- **Undo Operations**: Comprehensive undo system for bids and sales (Super Admin)

### 👥 **Role-Based Access Control**
- **Super Admin**: Full control over auction, undo operations, user management
- **Admin**: Auction management, bidding controls, team operations  
- **Sub-Admin**: Limited administrative functions
- **Spectator**: Read-only access to live auction data

### 🏆 **Team & Player Management**
- **Team Setup**: Configurable team budgets and player limits
- **Player Import**: Bulk upload players via Excel files
- **Captain Management**: Special handling for team captains
- **Retained Players**: Support for pre-auction player retention
- **Player Categories**: Organize players by experience, role, and pricing tiers

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

### 🎨 **Modern User Interface**
- **Professional Design**: Glass-morphism effects with gradient backgrounds
- **Responsive Layout**: Mobile-friendly design for all screen sizes
- **Typography Hierarchy**: 4-level professional font system
- **Accessibility**: High contrast, proper color schemes, keyboard navigation
- **Interactive Elements**: Smooth animations, hover effects, loading states

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

## 📱 Application Structure

### **Frontend (React.js)**
- **Modern React Hooks**: useState, useEffect, custom hooks
- **Real-time Communication**: Socket.io client integration  
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router for navigation
- **State Management**: Context API and local state
- **HTTP Client**: Axios for API communication

### **Backend (Node.js/Express)**
- **RESTful API**: Comprehensive endpoint structure
- **Real-time Events**: Socket.io server implementation
- **Security**: JWT authentication, input validation
- **File Processing**: Secure Excel parsing and generation
- **Error Handling**: Centralized error management
- **Data Persistence**: JSON-based data storage

## 🎮 How to Use

### **For Administrators:**

1. **Setup Auction**:
   - Upload player data via Excel file
   - Configure team budgets and player limits
   - Set auction parameters

2. **Manage Teams**:
   - Add/edit team information
   - Assign captains and retained players
   - Monitor team budgets

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
- `POST /api/auction/start` - Start auction
- `POST /api/auction/stop` - Stop auction
- `POST /api/auction/upload-players` - Upload player data

### **Bidding Operations**
- `POST /api/auction/bidding/place` - Place bid for team
- `POST /api/auction/bidding/cancel` - Cancel current bidding
- `POST /api/auction/bidding/undo` - Undo last operation

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature description'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🐛 Support & Issues

- **Bug Reports**: Open an issue on GitHub
- **Feature Requests**: Discuss in GitHub Issues
- **Documentation**: Check the wiki for detailed guides

---

**Made with ❤️ for cricket auction enthusiasts**
