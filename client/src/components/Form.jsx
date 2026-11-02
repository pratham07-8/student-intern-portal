import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useForm } from '../context/FormContext';

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Form = () => {
  const { form, updateField } = useForm();
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const todayStr = getTodayString();

  const validate = () => {
    const newErrors = {};
    if (!form.traineeName || !form.traineeName.trim()) {
      newErrors.traineeName = 'Trainee Name is required';
    }
    if (!form.relationship || !form.relationship.trim()) {
      newErrors.relationship = 'Relationship is required';
    }
    if (!form.instituteName || !form.instituteName.trim()) {
      newErrors.instituteName = 'University/Institute Name is required';
    }
    if (!form.instituteAddress || !form.instituteAddress.trim()) {
      newErrors.instituteAddress = 'Campus Address & District is required';
    }
    if (!form.pincode || !form.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    }
    if (!form.fromDate) {
      newErrors.fromDate = 'From Date is required';
    } else if (form.fromDate < todayStr) {
      newErrors.fromDate = 'Training From date cannot be in the past';
    }
    if (!form.toDate) {
      newErrors.toDate = 'To Date is required';
    } else if (form.fromDate && form.toDate < form.fromDate) {
      newErrors.toDate = 'Training To date cannot be before From date';
    } else if (form.toDate < todayStr) {
      newErrors.toDate = 'Training To date cannot be in the past';
    }
    if (!form.areaOfTraining || !form.areaOfTraining.trim()) {
      newErrors.areaOfTraining = 'Area of Training is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      navigate('/GuideDetails');
    }
  };

  return (
    <>
      <Navbar /> 
      <div className="w-full max-w-2xl mx-auto mt-8 bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-6 pb-3 border-b-2 border-blue-100">
          Trainee Details
        </h2>

        {Object.keys(errors).length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
            Please fill in all mandatory Trainee Details correctly before continuing to Guide Details.
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Trainee Name <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 w-24"
              value={form.salutation}
              onChange={(e) => updateField('salutation', e.target.value)}
            >
              <option>Mr.</option>
              <option>Ms.</option>
              <option>Dr.</option>
            </select>
            <input
              type="text"
              placeholder="Enter full name"
              className={`flex-1 border rounded-lg px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 ${
                errors.traineeName ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
              }`}
              value={form.traineeName}
              onChange={(e) => {
                updateField('traineeName', e.target.value);
                if (errors.traineeName) setErrors((prev) => ({ ...prev, traineeName: '' }));
              }}
            />
          </div>
          {errors.traineeName && <p className="text-xs text-red-500 mt-1">{errors.traineeName}</p>}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Relationship <span className="text-red-500">*</span>
          </label>
          <select
            className={`w-full border rounded-lg px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 ${
              errors.relationship ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
            }`}
            value={form.relationship}
            onChange={(e) => {
              updateField('relationship', e.target.value);
              if (errors.relationship) setErrors((prev) => ({ ...prev, relationship: '' }));
            }}
          >
            <option value="">Select relationship</option>
            <option>Son</option>
            <option>Daughter</option>
            <option>Relative</option>
          </select>
          {errors.relationship && <p className="text-xs text-red-500 mt-1">{errors.relationship}</p>}
        </div>

        {/* Institute & Address Structured Inputs */}
        <div className="mb-5 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-3">
            Institute / University Address Details
          </h3>
          
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              University / Institute Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Indian Institute of Technology Delhi"
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
                errors.instituteName ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
              }`}
              value={form.instituteName}
              onChange={(e) => {
                updateField('instituteName', e.target.value);
                if (errors.instituteName) setErrors((prev) => ({ ...prev, instituteName: '' }));
              }}
            />
            {errors.instituteName && <p className="text-xs text-red-500 mt-1">{errors.instituteName}</p>}
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Department / School Name <span className="text-gray-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Department of Computer Science & Engineering"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={form.departmentName || ''}
              onChange={(e) => updateField('departmentName', e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-[2]">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campus / Street Address & District <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Hauz Khas, New Delhi"
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
                  errors.instituteAddress ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
                }`}
                value={form.instituteAddress || ''}
                onChange={(e) => {
                  updateField('instituteAddress', e.target.value);
                  if (errors.instituteAddress) setErrors((prev) => ({ ...prev, instituteAddress: '' }));
                }}
              />
              {errors.instituteAddress && <p className="text-xs text-red-500 mt-1">{errors.instituteAddress}</p>}
            </div>

            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength="10"
                placeholder="e.g. 110016"
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 ${
                  errors.pincode ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
                }`}
                value={form.pincode || ''}
                onChange={(e) => {
                  updateField('pincode', e.target.value.replace(/[^\d-]/g, ''));
                  if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                }}
              />
              {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-5">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Training From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={todayStr}
              className={`w-full border rounded-lg px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 ${
                errors.fromDate ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
              }`}
              value={form.fromDate}
              onChange={(e) => {
                updateField('fromDate', e.target.value);
                if (errors.fromDate) setErrors((prev) => ({ ...prev, fromDate: '' }));
              }}
            />
            {errors.fromDate && <p className="text-xs text-red-500 mt-1">{errors.fromDate}</p>}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Training To <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={form.fromDate || todayStr}
              className={`w-full border rounded-lg px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 ${
                errors.toDate ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
              }`}
              value={form.toDate}
              onChange={(e) => {
                updateField('toDate', e.target.value);
                if (errors.toDate) setErrors((prev) => ({ ...prev, toDate: '' }));
              }}
            />
            {errors.toDate && <p className="text-xs text-red-500 mt-1">{errors.toDate}</p>}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Area of Training <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Electrical Engineering, HR Management"
            className={`w-full border rounded-lg px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 ${
              errors.areaOfTraining ? 'border-red-500 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-300'
            }`}
            value={form.areaOfTraining}
            onChange={(e) => {
              updateField('areaOfTraining', e.target.value);
              if (errors.areaOfTraining) setErrors((prev) => ({ ...prev, areaOfTraining: '' }));
            }}
          />
          {errors.areaOfTraining ? (
            <p className="text-xs text-red-500 mt-1">{errors.areaOfTraining}</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Specify the domain of training/internship at Corporate Centre.</p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            className="bg-blue-800 text-white px-8 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-900 transition"
            onClick={handleContinue}
          >
            Continue →
          </button>
        </div> 
      </div> 
    </>
  )
}

export default Form
