const http = require('http');

const data = JSON.stringify({
  name: "TestAdmin",
  email: "testadmin@example.com",
  password: "password123",
  role: "admin",
  phone: "1234567890",
  dob: "1990-01-01",
  address: "123 Test Street",
  organizationName: "Test Organization",
  organizationContact: "9876543210",
  organizationEmail: "org@test.com",
  organizationAddress: "456 Org Road",
  securityQuestion: "mother",
  securityAnswer: "Jane"
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/administrator/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(data);
req.end();

