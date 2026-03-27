const axios = require('axios');

async function checkApi() {
    try {
        const response = await axios.get('http://localhost:5000/api/v1/courses');
        console.log(`API returned ${response.data.data.length} courses`);
        response.data.data.forEach(c => {
            console.log(`- ${c.title} (Quarter: ${c.quarter})`);
        });
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

checkApi();
