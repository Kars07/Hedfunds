import React, { useState } from 'react';
import { useWallet } from './Dashboard';

const CivilServantVerification: React.FC = () => {
  const { connection, submitCivilServantApplication, civilServantStatus, checkCivilServantStatus } = useWallet();
  const [formData, setFormData] = useState({
    companyName: '',
    officialId: '',
    hrVerificationDocument: '',
    officialCompanyLetters: '',
    fullName: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connection) {
      setSubmitMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    // Validate form data
    const requiredFields = ['companyName', 'officialId', 'hrVerificationDocument', 'officialCompanyLetters', 'fullName', 'email'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData].trim());
    
    if (missingFields.length > 0) {
      setSubmitMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const result = await submitCivilServantApplication(formData);
      
      if (result.success) {
        setSubmitMessage({ type: 'success', text: result.message || 'Application submitted successfully! We will review your application within 3-5 business days.' });
        // Reset form on success
        setFormData({
          companyName: '',
          officialId: '',
          hrVerificationDocument: '',
          officialCompanyLetters: '',
          fullName: '',
          email: ''
        });
        setShowForm(false);
        
        // Refresh status after a short delay
        setTimeout(() => {
          if (connection?.address) {
            checkCivilServantStatus(connection.address);
          }
        }, 1000);
      } else {
        setSubmitMessage({ type: 'error', text: result.message || 'Failed to submit application. Please check your information and try again.' });
      }
    } catch (error) {
      console.error('Application submission error:', error);
      setSubmitMessage({ type: 'error', text: 'Network error occurred. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyAgain = () => {
    setShowForm(true);
    setSubmitMessage(null);
    // Clear any existing form data for a fresh start
    setFormData({
      companyName: '',
      officialId: '',
      hrVerificationDocument: '',
      officialCompanyLetters: '',
      fullName: '',
      email: ''
    });
  };

  const handleBackToStatus = () => {
    setShowForm(false);
    setSubmitMessage(null);
  };

  // Show status if already applied and not showing form
  if (civilServantStatus.data && !civilServantStatus.verified && !showForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
            <h1 className="text-3xl font-bold flex items-center">
              <i className="bx bx-shield-check mr-3"></i>
              Civil Servant Verification Status
            </h1>
          </div>
          
          <div className="p-8">
            <div className="text-center">
              {civilServantStatus.data.verification_status === 'pending' ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <i className="bx bx-time text-2xl text-orange-600"></i>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Application Pending</h2>
                  <p className="text-gray-600 mb-4">
                    Your civil servant verification application is currently under review.
                    We'll notify you once the verification is complete.
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Application submitted: {new Date(civilServantStatus.data.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-300 mr-3"
                    >
                      <i className="bx bx-refresh mr-2"></i>
                      Refresh Status
                    </button>
                  </div>
                </div>
              ) : civilServantStatus.data.verification_status === 'rejected' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-red-100 p-3 rounded-full">
                      <i className="bx bx-x-circle text-2xl text-red-600"></i>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Application Rejected</h2>
                  <p className="text-gray-600 mb-4">
                    Your civil servant verification application was rejected. Please review the reason below and submit a new application with corrected information.
                  </p>
                  {civilServantStatus.data.rejection_reason && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                      <p className="text-red-700 font-medium mb-2">Rejection Reason:</p>
                      <p className="text-red-600">{civilServantStatus.data.rejection_reason}</p>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleApplyAgain}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105"
                    >
                      <i className="bx bx-plus mr-2"></i>
                      Submit New Application
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                    >
                      <i className="bx bx-refresh mr-2"></i>
                      Refresh Status
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <i className="bx bx-shield-check mr-3"></i>
                Civil Servant Verification
              </h1>
              <p className="text-blue-100 mt-2">
                {civilServantStatus.data && civilServantStatus.data.verification_status === 'rejected' 
                  ? 'Submit a new application with corrected information'
                  : 'Apply for civil servant verification to access special loan terms and benefits'
                }
              </p>
            </div>
            {civilServantStatus.data && (
              <button
                onClick={handleBackToStatus}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center"
              >
                <i className="bx bx-arrow-back mr-2"></i>
                Back to Status
              </button>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Connection Status */}
          {!connection && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <i className="bx bx-error-circle text-red-500 mr-2"></i>
                <p className="text-red-700">Please connect your wallet to proceed with verification</p>
              </div>
            </div>
          )}

          {/* Submit Message */}
          {submitMessage && (
            <div className={`border rounded-lg p-4 ${
              submitMessage.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-start">
                <i className={`bx ${submitMessage.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'} mr-2 mt-0.5 flex-shrink-0`}></i>
                <div className="flex-1">
                  <p>{submitMessage.text}</p>
                  {submitMessage.type === 'success' && (
                    <p className="mt-2 text-sm font-medium">
                      You will be notified via email once your application is reviewed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rejection Notice */}
          {civilServantStatus.data && civilServantStatus.data.verification_status === 'rejected' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <i className="bx bx-info-circle text-yellow-600 mr-2 mt-0.5 flex-shrink-0"></i>
                <div className="flex-1">
                  <p className="text-yellow-800 font-medium">Resubmitting Application</p>
                  <p className="text-yellow-700 text-sm mt-1">
                    Please ensure all information is accurate and documents are clear and valid.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Enter your full name as on official documents"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company/Agency Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="e.g., Ministry of Education, Lagos State Government"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Official ID/Employee ID *
              </label>
              <input
                type="text"
                name="officialId"
                value={formData.officialId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                placeholder="Enter your official/employee ID number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HR Verification Document URL *
            </label>
            <input
              type="url"
              name="hrVerificationDocument"
              value={formData.hrVerificationDocument}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              placeholder="https://drive.google.com/... or https://dropbox.com/..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload your HR verification document to Google Drive, Dropbox, or similar service and provide the public link
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Official Company Letters/Documents URLs *
            </label>
            <textarea
              name="officialCompanyLetters"
              value={formData.officialCompanyLetters}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              placeholder="https://drive.google.com/document1
https://dropbox.com/document2
https://drive.google.com/document3"
            />
            <p className="text-sm text-gray-500 mt-1">
              Provide URLs to official company letters, employment letters, or other supporting documents (one URL per line)
            </p>
          </div>

          {/* Information Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="bx bx-info-circle text-blue-500 text-lg mr-2 mt-0.5 flex-shrink-0"></i>
              <div className="text-blue-700 text-sm">
                <p className="font-medium mb-1">Verification Process:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All documents will be reviewed by our verification team</li>
                  <li>Verification typically takes 3-5 business days</li>
                  <li>You'll be notified via email once verification is complete</li>
                  <li>Verified civil servants get access to special loan terms and higher limits</li>
                  <li>Ensure all documents are clear, valid, and publicly accessible</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            {civilServantStatus.data && (
              <button
                type="button"
                onClick={handleBackToStatus}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-8 rounded-lg transition duration-300"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!connection || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {civilServantStatus.data && civilServantStatus.data.verification_status === 'rejected' 
                    ? 'Resubmitting...' 
                    : 'Submitting...'
                  }
                </div>
              ) : (
                <div className="flex items-center">
                  <i className="bx bx-paper-plane mr-2"></i>
                  {civilServantStatus.data && civilServantStatus.data.verification_status === 'rejected' 
                    ? 'Resubmit Application' 
                    : 'Submit Application'
                  }
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CivilServantVerification;