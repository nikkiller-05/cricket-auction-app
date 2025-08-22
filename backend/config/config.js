const config = {
    port: 5000,
    jwtSecret: 'cricket_auction_secret_key_2025',
    
    // Default auction settings
    defaultSettings: {
      basePrice: 10,
      teamCount: 4,
      startingBudget: 1000,
      biddingIncrements: [
        { threshold: 50, increment: 5 },
        { threshold: Infinity, increment: 10 }
      ]
    },
  
    // Default admin credentials
    defaultAdmin: {
      id: '1',
      username: 'admin',
      password: 'admin@123' // Will be hashed
    },
  
    // File upload settings
    upload: {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ]
    }
  };
  
  module.exports = config;
  