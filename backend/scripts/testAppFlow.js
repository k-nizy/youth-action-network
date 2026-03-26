async function run() {
    const API_URL = 'http://localhost:5000/api/v1';

    console.log('[1] Logging in as Admin to create test applicant');
    let res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'yaneip26@gmail.com', password: 'Pandora3@' })
    });
    let data = await res.json();
    const adminToken = data.token;
    
    // Create an applicant
    const rNum = Math.floor(Math.random() * 1000);
    const applicantEmail = `applicant${rNum}@mailinator.com`;
    console.log(`[2] Registering new applicant: ${applicantEmail}`);
    res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: "Test Applicant",
            email: applicantEmail,
            password: "Testpassword123!",
            role: "applicant",
            organization: "Test Org"
        })
    });
    data = await res.json();
    if(!data.success) throw new Error("Registration failed: " + JSON.stringify(data));
    const applicantToken = data.token;
    
    console.log('[3] Submitting Application as Applicant');
    res = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${applicantToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            submissionData: {
                organization: {
                    name: "Test Org"
                },
                representative: {
                    email: "applicantrep@mailinator.com"
                },
                sector: "Education",
                yearsOfOperation: 2,
                motivation: "Testing E2E flow"
            },
            documents: []
        })
    });
    data = await res.json();
    if(!data.success) throw new Error("Application submission failed: " + JSON.stringify(data));
    const applicationId = data.data._id;
    console.log('✅ Application submitted! ID:', applicationId);

    console.log('[4] Approving Application as Admin');
    res = await fetch(`${API_URL}/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: 'approved',
            reviewerNotes: 'Automated test approval'
        })
    });
    data = await res.json();
    if(!data.success) throw new Error("Approval failed: " + JSON.stringify(data));
    console.log('✅ Application approved! Status:', data.data.status);
    
    console.log('[5] Verifying Role Change');
    res = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${applicantToken}` }
    });
    data = await res.json();
    if(data.data.role !== 'member') throw new Error("Role was not changed to member! Current role: " + data.data.role);
    console.log('✅ Role successfully upgraded to member!');

    console.log('🎉 Application E2E Complete. Check backend window for "Message sent: <id>" to verify email delivery.');
}

run().catch(console.error);
