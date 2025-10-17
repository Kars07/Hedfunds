import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface VerificationProps {
  onComplete: () => void;
  onClose: () => void;
}

const Verification: React.FC<VerificationProps> = ({ onComplete, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<{
    bvnOrNin: string;
    selectedOption: string;
    photo: File | null;
  }>({
    bvnOrNin: '',
    selectedOption: '',
    photo: null,
  });

  const navigate = useNavigate();

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSelectOption = (option: string) => {
    setFormData({ ...formData, selectedOption: option });
    setStep(step + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6">
        {step === 1 && (
          <div className="text-center">
            <h2 className="text-lg font-semibold">Verification</h2>
            <div className="flex justify-center mt-4">
              <i className="bx bx-shield-check text-4xl text-orange-500"></i>
            </div>
            <h3 className="text-xl font-bold mt-4">
              Build trust by verifying your identity
            </h3>
            <p className="text-gray-600 mt-4">
              KYC provides identity verification services for SwiftFund members.
            </p>
            <div className="flex items-start mt-4 text-left">
              <i className="bx bx-id-card text-xl text-gray-500"></i>
              <p className="ml-2 text-gray-600">
                You’ll need to provide a BVN, NIN, Government ID, or Residential Permit to verify your identity.
              </p>
            </div>
            <a href="#" className="text-orange-500 mt-4 block">How does this work?</a>
            <div className="text-center text-sm text-gray-500 mt-6">
              <p>
                By clicking <span className="font-medium">Verify with SwiftFund</span>, you consent to SwiftFund sharing a RequestID and a link to your SwiftFund profile with KYC, in accordance with <a href="#" className="text-orange-500">SwiftFund's Privacy Policy</a>.
              </p>
              <a href="#" className="text-orange-500 mt-2 block">Learn more</a>
            </div>
            <div className="mt-6">
              <button
                onClick={handleNext}
                className="bg-white border-2 border-orange-600 text-orange-600 font-bold py-2 px-4 rounded-3xl w-1/2 hover:bg-orange-600 hover:text-white transition duration-300"
              >
                Verify with SwiftFund
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Step 2: Select Verification Method</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSelectOption('BVN')}
                className="flex flex-col items-center bg-gray-100 border p-4 rounded-lg shadow hover:bg-orange-100"
              >
                <i className="bx bxs-bank text-4xl text-orange-500"></i>
                <span className="mt-2 font-medium">BVN</span>
              </button>
              <button
                onClick={() => handleSelectOption('NIN')}
                className="flex flex-col items-center bg-gray-100 border p-4 rounded-lg shadow hover:bg-orange-100"
              >
                <i className="bx bxs-id-card text-4xl text-orange-500"></i>
                <span className="mt-2 font-medium">NIN</span>
              </button>
            </div>
            <button
              onClick={handleBack}
              className="mt-6 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              Back
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">
              {formData.selectedOption === 'BVN'
                ? 'Step 3: Enter Your Bank Verification Number'
                : 'Step 3: Enter Your National Identity Number'}
            </h2>
            <input
              type="text"
              placeholder={
                formData.selectedOption === 'BVN'
                  ? 'Enter your Bank Verification Number'
                  : 'Enter your National Identity Number'
              }
              className="w-full border rounded-lg p-3 mb-4"
              value={formData.bvnOrNin}
              onChange={(e) => setFormData({ ...formData, bvnOrNin: e.target.value })}
            />
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Step 4: Upload Passport Photo</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData({ ...formData, photo: e.target.files?.[0] || null })
              }
              className="w-full mb-4"
            />
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center">
            <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Verification Complete</h2>
              <div className="flex flex-col items-center mt-6">
                <i className="bx bxs-check-circle text-6xl text-orange-500 mb-4"></i>
                <h3 className="text-lg font-semibold">Verification Complete</h3>
                <p className="text-gray-600 mt-2">
                  Congratulations! You have been successfully verified.
                </p>
                <button
                  onClick={onComplete}
                  className="mt-6 bg-orange-600 text-white py-2 px-6 rounded-full hover:bg-orange-700 transition duration-300"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Verification;
