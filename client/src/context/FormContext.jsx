import { useContext , createContext, useState} from "react";
import { API_BASE_URL } from "../config";

const FormContext = createContext();

const INITIAL_FORM = {
    salutation:       'Ms.',
    traineeName:      '',
    relationship:     '',
    instituteName:    '',
    departmentName:   '',
    instituteAddress: '',
    pincode:          '',
    fromDate:         '',
    toDate:           '',
    areaOfTraining:   '',
    guideName:        '',
    guideSalutation:  'Ms.',
    guideDesignation: '',
    guideDepartment:  '',
}

export function isTraineeDetailsValid(form) {
    if (!form) return false;
    if (!form.traineeName || !form.traineeName.trim()) return false;
    if (!form.relationship || !form.relationship.trim()) return false;
    if (!form.instituteName || !form.instituteName.trim()) return false;
    if (!form.instituteAddress || !form.instituteAddress.trim()) return false;
    if (!form.pincode || !form.pincode.trim()) return false;
    if (!form.fromDate) return false;
    if (!form.toDate) return false;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (form.fromDate < todayStr) return false;
    if (form.toDate < form.fromDate) return false;
    if (!form.areaOfTraining || !form.areaOfTraining.trim()) return false;
    return true;
}

export function isGuideDetailsValid(form) {
    if (!form) return false;
    if (!form.guideName || !form.guideName.trim()) return false;
    if (!form.guideDesignation || !form.guideDesignation.trim()) return false;
    if (!form.guideDepartment || !form.guideDepartment.trim()) return false;
    return true;
}

export function isFormValid(form) {
    return isTraineeDetailsValid(form) && isGuideDetailsValid(form);
}

export function FormProvider({ children }) {
    const [form, setForm]       = useState(INITIAL_FORM)
    const [step, setStep]       = useState(1)
    const [submitted, setSubmitted] = useState(false)

    // Update a single field: updateField('traineeName', 'Rahul')
    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    // Reset everything after submit
    const resetForm = () => {
        setForm(INITIAL_FORM)
        setStep(1)
        setSubmitted(false)
    }

    // Submit to backend
    const submitForm = async () => {
        try {
            const token = localStorage.getItem('token');

            // Format full institute address header from structured fields
            const fullInstitute = [
                form.instituteName?.trim(),
                form.departmentName?.trim(),
                form.instituteAddress?.trim() && form.pincode?.trim()
                    ? `${form.instituteAddress.trim()}-${form.pincode.trim()}`
                    : (form.instituteAddress?.trim() || form.pincode?.trim())
            ].filter(Boolean).join(',\n');

            const payload = {
                ...form,
                instituteName: fullInstitute
            };

            const res = await fetch(`${API_BASE_URL}/Review`, {
                method:  'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body:    JSON.stringify(payload),
            })
            const data = await res.json()

            if (data.success) {
                setSubmitted(true)
                return { success: true, requestId: data.requestId }
            } else {
                return { success: false, message: data.message || data.error || 'Failed to submit request. Please try again.' }
            }
        } catch (err) {
            console.error('Submit error:', err)
            return { success: false, message: 'Network error. Try again.' }
        }
    }

    return (
        <FormContext.Provider value={{
            form,
            step,
            submitted,
            updateField,
            setStep,
            submitForm,
            resetForm,
            isTraineeDetailsValid: () => isTraineeDetailsValid(form),
            isGuideDetailsValid: () => isGuideDetailsValid(form),
            isFormValid: () => isFormValid(form),
        }}>
            {children}
        </FormContext.Provider>
    )
}

export function useForm() {
    return useContext(FormContext)
}