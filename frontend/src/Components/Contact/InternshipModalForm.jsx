import React, { useState } from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Importing styles for PhoneInput

const InternshipModalForm = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
        mobile: '',
        internship: '',
        message: '',
        cv: null, // Store file for upload
    });

    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 2: Handle form input changes
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'cv') {
            setFormData((prev) => ({ ...prev, cv: files[0] }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handlePhoneChange = (value) => {
        setFormData((prev) => ({ ...prev, mobile: value }));
    };

    // Step 3: Handle form submission (async POST request)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('');
        setError('');

        const form = new FormData();
        form.append('fname', formData.fname);
        form.append('lname', formData.lname);
        form.append('email', formData.email);
        form.append('mobile', formData.mobile);
        form.append('internship', formData.internship);
        form.append('message', formData.message);

        if (formData.cv) {
            form.append('cv', formData.cv);
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/internship`, {
                method: 'POST',
                body: form,
            });

            const result = await response.json();

            if (response.ok) {
                setStatus('Message sent successfully!');
                setFormData({
                    fname: '',
                    lname: '',
                    email: '',
                    mobile: '',
                    internship: '',
                    message: '',
                    cv: null,
                });

                setTimeout(() => {
                    onClose();
                    window.location.reload();
                }, 1500);
            } else {
                setError(result?.message || 'Submission failed.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 4: Modal display logic
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="bg-white w-full max-w-md rounded-xl shadow-2xl relative">
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h3 className="text-xl font-semibold">Apply for Internship</h3>
                        <button onClick={onClose} className="text-gray-400 text-xl font-semibold hover:text-red-500" >
                            ✕
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Step 5: Form */}
                        <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-left block">First Name</label>
                                    <input
                                        name="fname"
                                        value={formData.fname}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-left block">Last Name</label>
                                    <input
                                        name="lname"
                                        value={formData.lname}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-left block">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-left block">Phone Number</label>
                                    <PhoneInput
                                        defaultCountry="IN"
                                        value={formData.mobile}
                                        onChange={handlePhoneChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-left block">Internship Role</label>
                                <select
                                    name="internship"
                                    value={formData.internship}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">Select Designation</option>
                                    <option value="FULL STACK DEVELOPER">FULL STACK DEVELOPER</option>
                                    <option value="UI UX DESIGNER">UI UX DESIGNER</option>
                                    <option value="DATA ANALYST">DATA ANALYST</option>
                                    <option value="DIGITAL MARKETING">DIGITAL MARKETING</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-sm text-left block">Upload CV</label>
                                <input
                                    type="file"
                                    name="cv"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-left block">Message</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="4"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                ></textarea>
                            </div>

                           

                            {/* Step 7: Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#004aad] text-white py-2 rounded hover:bg-blue-700 transition"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Application'}
                            </button>
                        </form>

                        {/* Step 8: Status/Error Messages */}
                        {status && <div className="mt-4 text-green-600 text-center">{status}</div>}
                        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternshipModalForm;