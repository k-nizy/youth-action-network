async function checkApi() {
    try {
        const res = await fetch('http://localhost:5000/api/v1/courses');
        const data = await res.json();
        console.log(`API returned ${data.data.length} courses`);
        data.data.forEach(c => {
            console.log(`- ${c.title} (Quarter: ${c.quarter}, Status: ${c.status})`);
        });
    } catch (err) {
        console.error('API Error:', err.message);
    }
}

checkApi();
