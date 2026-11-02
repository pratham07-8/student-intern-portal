import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './Navbar'
import { useForm, isTraineeDetailsValid, isGuideDetailsValid, isFormValid } from '../context/FormContext'

const ReviewRow = ({ label, value }) => (
    <div className="flex border-b border-gray-100 py-3">
        <span className="w-48 text-sm text-gray-500 flex-shrink-0">{label}</span>
        <span className="text-sm font-semibold text-blue-900">
            {value || <em className="text-gray-300 font-normal">Not filled</em>}
        </span>
    </div>
)

const ReviewForm = () => {
    const { form, submitForm, resetForm, submitted } = useForm()
    const navigate = useNavigate()
    const [submitError, setSubmitError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (submitted) return;
        if (!isTraineeDetailsValid(form)) {
            navigate('/TraineeDetails');
        } else if (!isGuideDetailsValid(form)) {
            navigate('/GuideDetails');
        }
    }, [form, submitted, navigate]);

    const handleBack = () => navigate('/GuideDetails')

    const handleSubmit = async () => {
        if (!isFormValid(form)) {
            setSubmitError('Please ensure all required Trainee and Guide details are filled in before submitting.');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        const result = await submitForm();
        setSubmitting(false);
        if (result && result.success) {
            navigate('/proposer-dashboard', { replace: true });
            setTimeout(() => {
                resetForm();
            }, 100);
        } else {
            setSubmitError(result?.message || 'Failed to submit request. Please try again.');
        }
    }

    return (
        <>
        <Navbar />
        <div className="w-full max-w-2xl mx-auto mt-8 bg-white rounded-2xl shadow-md p-8">

            <h2 className="text-2xl font-bold text-blue-800 mb-6 pb-3 border-b-2 border-blue-100">
                Review & Submit
            </h2>

            {submitError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                    {submitError}
                </div>
            )}

            <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2">
                Trainee Details
            </p>
            <div className="bg-gray-50 rounded-xl px-5 py-2 mb-6">
                <ReviewRow label="Name"             value={`${form.salutation} ${form.traineeName}`} />
                <ReviewRow label="Relationship"     value={form.relationship} />
                <ReviewRow label="Institute Name"   value={form.instituteName} />
                {form.departmentName && <ReviewRow label="Department/School" value={form.departmentName} />}
                <ReviewRow label="Campus Address"  value={form.instituteAddress} />
                <ReviewRow label="Pincode"         value={form.pincode} />
                <ReviewRow label="Training From"    value={form.fromDate} />
                <ReviewRow label="Training To"      value={form.toDate} />
                <ReviewRow label="Area of Training" value={form.areaOfTraining} />
            </div>

            <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2">
                Guide / Facilitator Details
            </p>
            <div className="bg-gray-50 rounded-xl px-5 py-2 mb-6">
                <ReviewRow label="Name"        value={`${form.guideSalutation} ${form.guideName}`} />
                <ReviewRow label="Designation" value={form.guideDesignation} />
                <ReviewRow label="Department"  value={form.guideDepartment} />
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={handleBack}
                    className="bg-blue-800 text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-900 transition"
                >
                    ← Back
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !isFormValid(form)}
                    className="bg-green-700 text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </div>

        </div>
        </>
    )
}

export default ReviewForm