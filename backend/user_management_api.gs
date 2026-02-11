/**
 * Google Apps Script Backend - Combined Authentication & User Management
 * 
 * IMPORTANT: This script combines your existing authentication with user management.
 * It uses the 'action' parameter to differentiate between operations:
 * - No 'action' parameter = Authentication (existing functionality)
 * - action='add/update/delete' = User management operations
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this entire script
 * 2. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1GtWgPMm-WeDNfebubp5ac76waeZGESA2bQ8JkEpHlZ4
 * 3. Go to Extensions → Apps Script
 * 4. REPLACE your existing Code.gs with this script
 * 5. Click Deploy → Manage Deployments
 * 6. Click "Edit" on your existing deployment (or create new deployment)
 * 7. Update version and click Deploy
 * 8. Copy the Web App URL and update it in user_management.html
 */

/**
 * Handle POST requests - Authentication AND User Management
 * This combines your existing auth with new user management features
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Check if this is a user management request (JSON with 'action' parameter)
  if (e.postData && e.postData.type === 'application/json') {
    try {
      const params = JSON.parse(e.postData.contents);
      
      // If 'action' exists, this is a user management request
      if (params.action) {
        return handleUserManagement(params);
      }
    } catch (error) {
      // If JSON parsing fails, continue with authentication logic below
    }
  }
  
  // --- EXISTING AUTHENTICATION LOGIC (UNCHANGED) ---
  var username = e.parameter.username;
  var pin = e.parameter.pin;
  var timestamp = e.parameter.timestamp;
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim() === username) {
      if (pin && data[i][1].toString().trim() === pin) {
        // Log and update timestamp
        if (timestamp) {
          var millis = Number(timestamp);
          Logger.log("Timestamp received: " + timestamp);
          if (!isNaN(millis)) {
            Logger.log("Parsed millis: " + millis);
            sheet.getRange(i + 1, 3).setValue(new Date(millis));
          } else {
            Logger.log("Invalid timestamp: " + timestamp);
          }
        }
        return ContentService.createTextOutput("valid");
      } else {
        return ContentService.createTextOutput("invalid");
      }
    }
  }

  return ContentService.createTextOutput("user not found");
}

/**
 * Handle user management operations (Add, Update, Delete)
 */
function handleUserManagement(params) {
  try {
    let result;
    
    switch (params.action) {
      case 'add':
        result = addUser(params.user);
        break;
      case 'update':
        result = updateUser(params.username, params.user);
        break;
      case 'delete':
        result = deleteUser(params.username);
        break;
      default:
        throw new Error('Invalid action: ' + params.action);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests - Fetch all users for management page
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const users = [];

    for (let i = 1; i < data.length; i++) {
      const user = {};
      headers.forEach((header, index) => {
        user[header] = data[i][index];
      });
      users.push(user);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: users
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Add a new user
 */
function addUser(user) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Check for duplicate username
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === user.Username) {
      throw new Error('Username already exists');
    }
  }

  // Prepare row data based on headers
  const rowData = headers.map(header => user[header] || '');
  
  // Append the new row
  sheet.appendRow(rowData);
  
  return 'User added successfully';
}

/**
 * Update an existing user
 */
function updateUser(oldUsername, user) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find the row with the matching username
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === oldUsername || data[i][0].toString().trim() === oldUsername) {
      rowIndex = i + 1; // +1 because sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('User not found: ' + oldUsername);
  }

  // Update the row
  headers.forEach((header, index) => {
    const value = user[header] !== undefined ? user[header] : data[rowIndex - 1][index];
    sheet.getRange(rowIndex, index + 1).setValue(value);
  });

  return 'User updated successfully';
}

/**
 * Delete a user
 */
function deleteUser(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Find the row with the matching username
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username || data[i][0].toString().trim() === username) {
      rowIndex = i + 1; // +1 because sheet rows are 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('User not found: ' + username);
  }

  // Delete the row
  sheet.deleteRow(rowIndex);

  return 'User deleted successfully';
}

/**
 * Test function - Call this from the Apps Script editor to test
 * Run > testScript (or click play button)
 */
function testScript() {
  // Test adding a user
  const testUser = {
    Username: 'test_user_' + new Date().getTime(),
    PIN: '1234',
    Name: 'Test User',
    role: 'viewer',
    zone_code: 'MZO',
    region_code: '',
    division_code: '',
    ccc_code: '',
    status: 'active'
  };
  
  Logger.log('Testing add user...');
  try {
    const result = addUser(testUser);
    Logger.log('✓ Add result: ' + result);
  } catch (e) {
    Logger.log('✗ Add error: ' + e.toString());
  }
}
