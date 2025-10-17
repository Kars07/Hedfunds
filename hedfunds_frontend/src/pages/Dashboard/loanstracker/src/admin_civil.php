<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Civil Servant Admin Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .main-content {
            padding: 30px;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .no-applications {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .no-applications i {
            font-size: 4rem;
            margin-bottom: 20px;
            color: #ddd;
        }

        .application-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 12px;
            margin-bottom: 20px;
            overflow: hidden;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .application-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }

        .application-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }

        .application-title {
            font-size: 1.3rem;
            font-weight: bold;
            color: #333;
        }

        .application-id {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }

        .application-date {
            color: #666;
            font-size: 0.9rem;
        }

        .application-body {
            padding: 25px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }

        .info-label {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            color: #666;
            word-break: break-word;
        }

        .document-links {
            margin: 20px 0;
        }

        .document-link {
            display: inline-block;
            background: #e3f2fd;
            color: #1976d2;
            padding: 8px 15px;
            border-radius: 20px;
            text-decoration: none;
            margin: 5px 10px 5px 0;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .document-link:hover {
            background: #1976d2;
            color: white;
            transform: translateY(-1px);
        }

        .action-buttons {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            flex-wrap: wrap;
        }

        .btn {
            padding: 12px 25px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            min-width: 120px;
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .btn-approve {
            background: linear-gradient(135deg, #4caf50, #45a049);
            color: white;
        }

        .btn-approve:hover:not(:disabled) {
            background: linear-gradient(135deg, #45a049, #3d8b40);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .btn-reject {
            background: linear-gradient(135deg, #f44336, #d32f2f);
            color: white;
        }

        .btn-reject:hover:not(:disabled) {
            background: linear-gradient(135deg, #d32f2f, #c62828);
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
        }

        .btn-refresh {
            background: linear-gradient(135deg, #2196f3, #1976d2);
            color: white;
            margin-bottom: 20px;
        }

        .btn-refresh:hover {
            background: linear-gradient(135deg, #1976d2, #1565c0);
            transform: translateY(-2px);
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }

        .modal-content {
            background-color: white;
            margin: 10% auto;
            padding: 30px;
            border-radius: 15px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .modal h3 {
            margin-bottom: 20px;
            color: #333;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
        }

        .form-group textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-family: inherit;
            resize: vertical;
            min-height: 100px;
        }

        .form-group textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .modal-buttons {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 25px;
        }

        .btn-cancel {
            background: #6c757d;
            color: white;
        }

        .btn-cancel:hover {
            background: #5a6268;
        }

        .alert {
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            font-weight: 500;
        }

        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .application-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .action-buttons {
                justify-content: center;
            }
            
            .modal-content {
                margin: 5% auto;
                width: 95%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Civil Servant Admin Dashboard</h1>
            <p>Review and manage civil servant verification applications</p>
        </div>
        
        <div class="main-content">
            <button class="btn btn-refresh" onclick="loadApplications()">
                🔄 Refresh Applications
            </button>
            
            <div id="stats" class="stats" style="display: none;">
                <div class="stat-card">
                    <div class="stat-number" id="totalApplications">0</div>
                    <div class="stat-label">Total Applications</div>
                </div>
            </div>
            
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <p>Loading applications...</p>
            </div>
            
            <div id="alerts"></div>
            
            <div id="applicationsList"></div>
        </div>
    </div>

    <!-- Rejection Modal -->
    <div id="rejectionModal" class="modal">
        <div class="modal-content">
            <h3>Reject Application</h3>
            <div class="form-group">
                <label for="rejectionReason">Reason for rejection:</label>
                <textarea id="rejectionReason" placeholder="Please provide a detailed reason for rejecting this application..."></textarea>
            </div>
            <div class="modal-buttons">
                <button class="btn btn-cancel" onclick="closeRejectionModal()">Cancel</button>
                <button class="btn btn-reject" onclick="confirmRejection()">Confirm Rejection</button>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let applications = [];
        let currentApplicationId = null;
        const API_BASE_URL = 'civil_servants.php'; // Update this to your actual API URL

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            loadApplications();
        });

        // Load pending applications
        async function loadApplications() {
            const loadingDiv = document.getElementById('loading');
            const applicationsDiv = document.getElementById('applicationsList');
            const statsDiv = document.getElementById('stats');
            
            loadingDiv.style.display = 'block';
            applicationsDiv.innerHTML = '';
            statsDiv.style.display = 'none';
            
            try {
                const response = await fetch(`${API_BASE_URL}?action=getAllPending`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    applications = data.applications || [];
                    displayApplications();
                    updateStats();
                } else {
                    showAlert('Error loading applications: ' + data.message, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Failed to load applications. Please check your connection.', 'error');
            } finally {
                loadingDiv.style.display = 'none';
            }
        }

        // Display applications
        function displayApplications() {
            const applicationsDiv = document.getElementById('applicationsList');
            
            if (applications.length === 0) {
                applicationsDiv.innerHTML = `
                    <div class="no-applications">
                        <div style="font-size: 4rem; margin-bottom: 20px;">📋</div>
                        <h3>No Pending Applications</h3>
                        <p>All civil servant applications have been processed.</p>
                    </div>
                `;
                return;
            }
            
            applicationsDiv.innerHTML = applications.map(app => `
                <div class="application-card">
                    <div class="application-header">
                        <div>
                            <div class="application-title">${escapeHtml(app.full_name)}</div>
                            <div class="application-id">ID: ${app.id} | Wallet: ${escapeHtml(app.wallet_address)}</div>
                        </div>
                        <div class="application-date">
                            Applied: ${formatDate(app.created_at)}
                        </div>
                    </div>
                    
                    <div class="application-body">
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Company Name</div>
                                <div class="info-value">${escapeHtml(app.company_name)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Official ID</div>
                                <div class="info-value">${escapeHtml(app.official_id)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Email</div>
                                <div class="info-value">${escapeHtml(app.email)}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">HR Verification Document</div>
                                <div class="info-value">${escapeHtml(app.hr_verification_document)}</div>
                            </div>
                        </div>
                        
                        <div class="document-links">
                            <strong>Official Company Letters:</strong><br>
                            ${formatCompanyLetters(app.official_company_letters)}
                        </div>
                        
                        <div class="action-buttons">
                            <button class="btn btn-approve" 
                                    onclick="approveApplication(${app.id})"
                                    id="approve-${app.id}">
                                ✅ Approve
                            </button>
                            <button class="btn btn-reject" 
                                    onclick="openRejectionModal(${app.id})"
                                    id="reject-${app.id}">
                                ❌ Reject
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Update statistics
        function updateStats() {
            const statsDiv = document.getElementById('stats');
            const totalAppsDiv = document.getElementById('totalApplications');
            
            totalAppsDiv.textContent = applications.length;
            statsDiv.style.display = applications.length > 0 ? 'grid' : 'none';
        }

        // Approve application
        async function approveApplication(applicationId) {
            const approveBtn = document.getElementById(`approve-${applicationId}`);
            const rejectBtn = document.getElementById(`reject-${applicationId}`);
            
            // Disable buttons
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            approveBtn.textContent = '⏳ Approving...';
            
            try {
                const response = await fetch(`${API_BASE_URL}?action=verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        civilServantId: applicationId,
                        action: 'approve'
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    showAlert('Application approved successfully!', 'success');
                    loadApplications(); // Reload to remove approved application
                } else {
                    showAlert('Error approving application: ' + data.message, 'error');
                    approveBtn.disabled = false;
                    rejectBtn.disabled = false;
                    approveBtn.textContent = '✅ Approve';
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Failed to approve application. Please try again.', 'error');
                approveBtn.disabled = false;
                rejectBtn.disabled = false;
                approveBtn.textContent = '✅ Approve';
            }
        }

        // Open rejection modal
        function openRejectionModal(applicationId) {
            currentApplicationId = applicationId;
            document.getElementById('rejectionReason').value = '';
            document.getElementById('rejectionModal').style.display = 'block';
        }

        // Close rejection modal
        function closeRejectionModal() {
            document.getElementById('rejectionModal').style.display = 'none';
            currentApplicationId = null;
        }

        // Confirm rejection
        async function confirmRejection() {
            const reason = document.getElementById('rejectionReason').value.trim();
            
            if (!reason) {
                showAlert('Please provide a reason for rejection.', 'error');
                return;
            }
            
            const approveBtn = document.getElementById(`approve-${currentApplicationId}`);
            const rejectBtn = document.getElementById(`reject-${currentApplicationId}`);
            
            // Disable buttons
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            rejectBtn.textContent = '⏳ Rejecting...';
            
            try {
                const response = await fetch(`${API_BASE_URL}?action=verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        civilServantId: currentApplicationId,
                        action: 'reject',
                        rejectionReason: reason
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    showAlert('Application rejected successfully.', 'success');
                    closeRejectionModal();
                    loadApplications(); // Reload to remove rejected application
                } else {
                    showAlert('Error rejecting application: ' + data.message, 'error');
                    approveBtn.disabled = false;
                    rejectBtn.disabled = false;
                    rejectBtn.textContent = '❌ Reject';
                }
            } catch (error) {
                console.error('Error:', error);
                showAlert('Failed to reject application. Please try again.', 'error');
                approveBtn.disabled = false;
                rejectBtn.disabled = false;
                rejectBtn.textContent = '❌ Reject';
            }
        }

        // Show alert message
        function showAlert(message, type) {
            const alertsDiv = document.getElementById('alerts');
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.textContent = message;
            
            alertsDiv.appendChild(alertDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 5000);
        }

        // Utility functions
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function formatCompanyLetters(letters) {
            if (!letters) return 'No letters provided';
            
            let lettersList = [];
            if (typeof letters === 'string') {
                try {
                    lettersList = JSON.parse(letters);
                } catch {
                    lettersList = [letters];
                }
            } else if (Array.isArray(letters)) {
                lettersList = letters;
            } else {
                lettersList = [letters.toString()];
            }
            
            return lettersList.map((letter, index) => 
                `<a href="${escapeHtml(letter)}" target="_blank" class="document-link">Document ${index + 1}</a>`
            ).join(' ');
        }

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('rejectionModal');
            if (event.target === modal) {
                closeRejectionModal();
            }
        }

        // Handle Escape key to close modal
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeRejectionModal();
            }
        });
    </script>
</body>
</html>