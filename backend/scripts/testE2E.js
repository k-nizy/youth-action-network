const fs = require('fs');
const path = require('path');

async function run() {
    const API_URL = 'http://localhost:5000/api/v1';

    console.log('[1] Logging in as Member');
    let res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dukeherve3@gmail.com', password: 'Thatone05$' })
    });
    let data = await res.json();
    if(!data.success) throw new Error("Member login failed: " + JSON.stringify(data));
    const memberToken = data.token;
    console.log('✅ Member logged in');

    console.log('[2] Uploading Assignment File');
    // Using FormData for Node.js using web fetch
    const formData = new FormData();
    const filePath = path.join(__dirname, '../../dummy_assignment.txt');
    const fileBuf = fs.readFileSync(filePath);
    const blob = new Blob([fileBuf], { type: 'text/plain' });
    formData.append('file', blob, 'dummy_assignment.txt');

    res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${memberToken}` },
        body: formData
    });
    data = await res.json();
    if(!data.success) throw new Error("File upload failed: " + JSON.stringify(data));
    const fileUrl = data.data.url;
    console.log('✅ File uploaded:', fileUrl);

    console.log('[2.5] Fetching courses to get a valid course ID');
    res = await fetch(`${API_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    data = await res.json();
    if(!data.success || data.data.length === 0) throw new Error("No courses found to submit assignment to.");
    const validCourseId = data.data[0]._id;

    console.log('[3] Submitting Assignment');
    res = await fetch(`${API_URL}/submissions`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${memberToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            courseId: validCourseId,
            quarter: "Q1",
            fileUrl: fileUrl,
            fileName: "dummy_assignment.txt",
            fileFormat: "txt"
        })
    });
    data = await res.json();
    if(!data.success) throw new Error("Submission failed: " + JSON.stringify(data));
    const submissionId = data.data._id;
    console.log('✅ Assignment submitted! ID:', submissionId);

    console.log('[4] Logging in as Admin');
    res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'yaneip26@gmail.com', password: 'Pandora3@' })
    });
    data = await res.json();
    if(!data.success) throw new Error("Admin login failed: " + JSON.stringify(data));
    const adminToken = data.token;
    console.log('✅ Admin logged in');

    console.log('[5] Grading Assignment (Admin)');
    res = await fetch(`${API_URL}/submissions/${submissionId}/review`, {
        method: 'PATCH',
        headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'graded',
            grade: 95,
            feedback: 'Excellent work!'
        })
    });
    data = await res.json();
    if(!data.success) throw new Error("Grading failed: " + JSON.stringify(data));
    console.log('✅ Assignment graded! Grade:', data.data.grade);
    
    console.log('🎉 E2E Verification Complete!');
}

run().catch(console.error);
