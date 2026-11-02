import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import WorkflowStepper from '../components/WorkflowStepper';
import LOGO from '../assets/logo.png';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [signature, setSignature] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Automatically reset inline error messages and remarks whenever selected request changes
  useEffect(() => {
    setMessage('');
    setRemarks('');
  }, [selectedRequest?.id]);

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;
    setDeleting(true);
    setMessage('');
    try {
      const res = await axios.delete(`${API_BASE_URL}/Review/${selectedRequest.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setToastMessage('Application deleted successfully!');
        setTimeout(() => setToastMessage(''), 5000);
        setShowDeleteModal(false);
        await fetchPendingRequests();
      }
    } catch (err) {
      console.error('Error deleting request:', err);
      setMessage(err.response?.data?.message || 'Failed to delete application.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignature(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRejectButtonLabel = () => {
    if (!user) return 'Reject / Send Back';
    switch (user.role) {
      case 'GUIDE':
        return 'Send Back to Proposer';
      case 'GUIDE_GM':
        return 'Send Back to Guide';
      case 'TRAINING_OFFICER':
        return 'Send Back to Dept GM';
      case 'HR_GM':
        return 'Send Back to Training Officer';
      default:
        return 'Reject / Send Back';
    }
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/Review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRequests(res.data.requests);
        if (res.data.requests.length > 0) {
          setSelectedRequest(res.data.requests[0]);
        } else {
          setSelectedRequest(null);
        }
      }
    } catch (err) {
      console.error('Error fetching pending requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPendingRequests();
  }, [token]);

  const handleAction = async (action) => {
    if (!selectedRequest) return;
    const currentTraineeName = `${selectedRequest.trainee?.salutation || ''} ${selectedRequest.trainee?.full_name || 'Application'}`.trim();
    setActionLoading(true);
    setMessage('');
    try {
      const res = await axios.post(
        `${API_BASE_URL}/Review/${selectedRequest.id}/action`,
        { action, remarks, signature: user?.role === 'HR_GM' ? signature : undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const actionVerb = action === 'APPROVE' ? (user?.role === 'HR_GM' ? 'approved & training letter issued' : 'approved & forwarded') : 'sent back';
        setToastMessage(`Application for ${currentTraineeName} was successfully ${actionVerb}!`);
        setTimeout(() => setToastMessage(''), 5000);
        setMessage('');
        setRemarks('');
        setSignature('');
        // Refresh list
        await fetchPendingRequests();
      }
    } catch (err) {
      console.error(err);
      const errMessage = err.response?.data?.message || err.response?.data?.error || 'Error processing request action.';
      setMessage(errMessage);
      // Automatically refresh pending list if request was already processed or moved
      if (errMessage.toLowerCase().includes('already') || errMessage.toLowerCase().includes('invalid')) {
        await fetchPendingRequests();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'GUIDE':
        return 'Guide (Mentor)';
      case 'GUIDE_GM':
        return 'Guide General Manager (Dept GM)';
      case 'TRAINING_OFFICER':
        return 'Training Officer';
      case 'HR_GM':
        return 'HR General Manager';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-4">
          <img src={LOGO} alt="Student Intern Portal" className="h-10 w-auto object-contain" />
          <span className="text-slate-400 border-l border-slate-200 pl-4 text-sm tracking-widest font-semibold uppercase">
            Reviewer Approval Dashboard
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{user?.name}</p>
            <p className="text-xs text-orange-600 font-bold">{getRoleLabel(user?.role)}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 text-red-600 text-xs font-bold rounded-xl transition duration-150 shadow-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Top Action Notification Toast */}
      {toastMessage && (
        <div className="max-w-7xl w-full mx-auto px-6 pt-4">
          <div className="p-4 bg-emerald-600 text-white text-sm font-semibold rounded-2xl shadow-md flex justify-between items-center animate-fade-in">
            <div className="flex items-center gap-2">
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage('')} className="text-emerald-200 hover:text-white font-bold text-xs ml-4">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6">
        {/* Left Side: Requests List */}
        <div className="w-full md:w-1/3 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex justify-between items-center">
            <span>Pending Approvals</span>
            <span className="bg-orange-100 text-orange-700 text-xs px-2.5 py-1 rounded-full font-extrabold">
              {requests.length}
            </span>
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-semibold text-slate-600 text-sm">No pending approvals</p>
              <p className="text-xs text-slate-400 mt-1">You are all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
              {requests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => {
                    setSelectedRequest(req);
                    setMessage('');
                    setRemarks('');
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-left ${selectedRequest?.id === req.id
                      ? 'bg-orange-50/60 border-orange-400 shadow-sm'
                      : 'bg-slate-50/50 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-slate-800">
                      {req.trainee?.salutation} {req.trainee?.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(req.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{req.trainee?.institute}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Guide: {req.guide?.full_name}</span>
                    <span className="text-orange-600 font-semibold text-[11px]">Review →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Selected Request Details */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          {selectedRequest ? (
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 text-left">
                    {selectedRequest.trainee?.salutation} {selectedRequest.trainee?.full_name}
                  </h2>
                  <p className="text-xs text-slate-400 text-left mt-0.5">
                    Submitted by Proposer: {selectedRequest.proposer?.name || 'Unknown'} ({selectedRequest.proposer?.email || 'N/A'})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full">
                    Action Required
                  </span>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm"
                    title="Delete Application"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Stepper Status */}
              <WorkflowStepper status={selectedRequest.status} theme="light" />

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left my-6">
                {/* Trainee Details */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
                  <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Trainee Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-400">Name:</span> <span className="font-semibold text-slate-700">{selectedRequest.trainee?.salutation} {selectedRequest.trainee?.full_name}</span></p>
                    <p><span className="text-slate-400">Relationship:</span> <span className="text-slate-650">{selectedRequest.trainee?.relationship}</span></p>
                    <p><span className="text-slate-400">Institute:</span> <span className="text-slate-650">{selectedRequest.trainee?.institute}</span></p>
                    <p><span className="text-slate-400">Duration:</span> <span className="text-slate-650">{new Date(selectedRequest.trainee?.from_date).toLocaleDateString()} to {new Date(selectedRequest.trainee?.to_date).toLocaleDateString()}</span></p>
                    <p><span className="text-slate-400">Area of Training:</span> <span className="text-slate-650">{selectedRequest.trainee?.area_of_training}</span></p>
                  </div>
                </div>

                {/* Guide Details */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80">
                  <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-3">Guide / Department</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-slate-400">Guide Name:</span> <span className="font-semibold text-slate-700">{selectedRequest.guide?.salutation} {selectedRequest.guide?.full_name}</span></p>
                    <p><span className="text-slate-400">Designation:</span> <span className="text-slate-650">{selectedRequest.guide?.designation}</span></p>
                    <p><span className="text-slate-400">Department:</span> <span className="text-slate-650">{selectedRequest.guide?.department}</span></p>
                  </div>
                </div>
              </div>

              {selectedRequest.remarks && (
                <div className="bg-amber-50/80 border border-amber-200/70 p-4 rounded-xl text-left mb-6">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Previous Remarks / Notes</span>
                    <span className="text-[10px] text-amber-600 font-normal lowercase">(optional context)</span>
                  </h4>
                  <p className="text-sm text-slate-700">{selectedRequest.remarks}</p>
                </div>
              )}

              {message && (
                <div className="bg-orange-50 border border-orange-250 text-orange-700 p-4 rounded-xl text-sm mb-4">
                  {message}
                </div>
              )}

              {/* HR GM Signature Section */}
              {user?.role === 'HR_GM' && (
                <div className="bg-blue-50/60 border border-blue-200/80 p-4 rounded-2xl text-left mb-6">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>✍️ HR Official Signature (For PDF Letter)</span>
                    <span className="text-[10px] font-normal text-blue-600">Optional - Will embed on training letter</span>
                  </h4>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureUpload}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-800 file:text-white hover:file:bg-blue-900 cursor-pointer"
                    />
                    {signature && (
                      <div className="flex items-center gap-2 bg-white p-2 border border-blue-200 rounded-xl">
                        <img src={signature} alt="Signature Preview" className="h-8 max-w-[120px] object-contain" />
                        <button
                          type="button"
                          onClick={() => setSignature('')}
                          className="text-red-500 text-xs font-bold hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Section */}
              <div className="border-t border-slate-100 pt-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-left">
                  Review Remarks / Comments <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter approval comments or rejection reasons (optional)..."
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition mb-4 resize-none"
                />

                <div className="flex gap-4">
                  <button
                    onClick={() => handleAction('REJECT')}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 font-bold rounded-xl text-sm transition duration-150 disabled:opacity-50 shadow-sm"
                  >
                    {getRejectButtonLabel()}
                  </button>
                  <button
                    onClick={() => handleAction('APPROVE')}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition duration-150 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                  >
                    {user?.role === 'HR_GM' ? 'Approve & Issue Training Letter' : 'Approve & Forward'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-400">
              <span className="text-6xl mb-4">🔍</span>
              <p className="text-lg text-slate-700">No request selected</p>
              <p className="text-sm mt-1 text-slate-400">Select a request from the left list to review its details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviewer Delete Modal */}
      {showDeleteModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-fade-in text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <span>⚠️</span> Delete Application
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to permanently delete the application for{' '}
              <strong className="text-slate-800">
                {selectedRequest.trainee?.salutation} {selectedRequest.trainee?.full_name}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequest}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
