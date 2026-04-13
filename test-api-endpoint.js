const http = require('http');

const testServicesEndpoint = () => {
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/services',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log(`Found ${jsonData.length} services`);
        jsonData.forEach(s => console.log(`- ${s.serviceName} (${s._id})`));
      } catch (e) {
        console.log('Not JSON response');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.end();
};

testServicesEndpoint();
