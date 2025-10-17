import { useState } from 'react';

const CreditScoreGuide = () => {
    const [showGuide, setShowGuide] = useState(false);

    return (
        <div className="min-h-screen bg-white-100 rounded-lg text-gray-900  relative overflow-hidden">

            <div className="relative z-10 p-4 pt-5 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent mb-4">
                        Credit Score Guide
                    </h1>
                    <p className="text-gray-600 text-lg">Master the decentralized credit scoring system</p>
                </div>

                {/* Main Guide Container */}
                <div className="bg-white/60 transition-all duration-500 ease-in-out opacity-100 scale-100 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                                <h3 className="text-3xl font-bold text-gray-800 flex items-center">
                                    How Credit Scoring Works
                                </h3>
                            </div>
                            <p className="text-gray-600 text-lg">
                                Learn how your payment behavior affects your credit score
                            </p>
                        </div>
                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="bg-gradient-to-r from-orange-600  to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium"
                        >
                            {showGuide ? 'Hide Guide' : 'View Guide'}
                        </button>
                    </div>
                    <div
                        className={`transition-all duration-500 ease-in-out overflow-hidden ${
                            showGuide
                            ? 'opacity-100 max-h-[100%] scale-100'
                            : 'opacity-0 max-h-0 scale-95 pointer-events-none'
                        }`}
                        >
                         <div className="mt-8 space-y-8">
                                {/* Credit Score Ranges */}
                                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-2 md:p-6 shadow-2xl">
                                    <div className="flex items-center  space-x-4 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl">
                                            🎯
                                        </div>
                                        <h4 className="text-2xl font-bold text-gray-800">Credit Score Ranges</h4>
                                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="group bg-gradient-to-r from-red-50/80 to-red-100/80 backdrop-blur-xl border border-red-200 rounded-2xl p-6 hover:border-red-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                                            <div className="text-center">
                                                <div className="text-red-600 font-bold text-2xl mb-2">300-549</div>
                                                <div className="text-red-800 font-semibold text-lg mb-1">Poor</div>
                                                <div className="text-sm text-red-600">High Risk</div>
                                            </div>
                                        </div>
                                        <div className="group bg-gradient-to-r from-yellow-50/80 to-yellow-100/80 backdrop-blur-xl border border-yellow-200 rounded-2xl p-6 hover:border-yellow-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                                            <div className="text-center">
                                                <div className="text-yellow-600 font-bold text-2xl mb-2">550-649</div>
                                                <div className="text-yellow-800 font-semibold text-lg mb-1">Fair</div>
                                                <div className="text-sm text-yellow-600">Moderate Risk</div>
                                            </div>
                                        </div>
                                        <div className="group bg-gradient-to-r from-blue-50/80 to-blue-100/80 backdrop-blur-xl border border-blue-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                                            <div className="text-center">
                                                <div className="text-blue-600 font-bold text-2xl mb-2">650-749</div>
                                                <div className="text-blue-800 font-semibold text-lg mb-1">Good</div>
                                                <div className="text-sm text-blue-600">Low Risk</div>
                                            </div>
                                        </div>
                                        <div className="group bg-gradient-to-r from-green-50/80 to-green-100/80 backdrop-blur-xl border border-green-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                                            <div className="text-center">
                                                <div className="text-green-600 font-bold text-2xl mb-2">750-850</div>
                                                <div className="text-green-800 font-semibold text-lg mb-1">Excellent</div>
                                                <div className="text-sm text-green-600">Very Low Risk</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Impact */}
                                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl">
                                            ⚡
                                        </div>
                                        <h4 className="text-2xl font-bold text-gray-800">Payment Impact on Credit Score</h4>
                                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {/* Early Payments */}
                                        <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/80 backdrop-blur-xl border border-blue-200 rounded-2xl p-6">
                                            <h5 className="text-xl font-bold text-blue-700 flex items-center mb-4">
                                                <span className="mr-3">🚀</span>
                                                Early Payments (Positive Impact)
                                            </h5>
                                            <div className="space-y-3">
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-blue-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">Very Early (25%+ of loan duration remaining)</span>
                                                        <span className="font-bold text-blue-600 text-lg">+100 points</span>
                                                    </div>
                                                </div>
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-blue-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">Early (50%+ of loan duration remaining)</span>
                                                        <span className="font-bold text-blue-600 text-lg">+75 points</span>
                                                    </div>
                                                </div>
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-blue-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">Moderately Early</span>
                                                        <span className="font-bold text-blue-600 text-lg">+50 points</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* On-Time Payments */}
                                        <div className="bg-gradient-to-r from-green-50/80 to-green-100/80 backdrop-blur-xl border border-green-200 rounded-2xl p-6">
                                            <h5 className="text-xl font-bold text-green-700 flex items-center mb-4">
                                                <span className="mr-3">✅</span>
                                                On-Time Payments (Positive Impact)
                                            </h5>
                                            <div className="space-y-3">
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-green-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">Well ahead of deadline (75%+ duration remaining)</span>
                                                        <span className="font-bold text-green-600 text-lg">+50 points</span>
                                                    </div>
                                                </div>
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-green-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">With time to spare (6+ days early)</span>
                                                        <span className="font-bold text-green-600 text-lg">+35 points</span>
                                                    </div>
                                                </div>
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-green-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">Before deadline (1-5 days early)</span>
                                                        <span className="font-bold text-green-600 text-lg">+15 points</span>
                                                    </div>
                                                </div>
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">On deadline day</span>
                                                        <span className="font-bold text-gray-600 text-lg">0 points</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Late Payments */}
                                        <div className="bg-gradient-to-r from-red-50/80 to-red-100/80 backdrop-blur-xl border border-red-200 rounded-2xl p-6">
                                            <h5 className="text-xl font-bold text-red-700 flex items-center mb-4">
                                                <span className="mr-3">⚠️</span>
                                                Late Payments (Negative Impact)
                                            </h5>
                                            <div className="space-y-3">
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-red-200 rounded-xl p-4 hover:border-red-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">1 day late</span>
                                                        <span className="font-bold text-red-600 text-lg">-5 points</span>
                                                    </div>
                                                </div>
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-red-200 rounded-xl p-4 hover:border-red-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">2-5 days late</span>
                                                        <span className="font-bold text-red-600 text-lg">-30 points</span>
                                                    </div>
                                                </div>
                                                <div className="group bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-red-200 rounded-xl p-4 hover:border-red-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-700 font-medium">6+ days late</span>
                                                        <span className="font-bold text-red-600 text-lg">-50 points</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tips for Better Credit */}
                                <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl">
                                            💡
                                        </div>
                                        <h4 className="text-2xl font-bold text-gray-800">Tips for Building Better Credit</h4>
                                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="group bg-gradient-to-r from-green-50/80 to-green-100/80 backdrop-blur-xl border border-green-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                <div className="flex items-start">
                                                    <span className="text-green-500 mr-3 mt-1 text-xl">✓</span>
                                                    <div>
                                                        <div className="font-semibold text-gray-800 text-lg">Pay Early When Possible</div>
                                                        <div className="text-gray-600">Early payments give the biggest credit score boost</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group bg-gradient-to-r from-green-50/80 to-green-100/80 backdrop-blur-xl border border-green-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                <div className="flex items-start">
                                                    <span className="text-green-500 mr-3 mt-1 text-xl">✓</span>
                                                    <div>
                                                        <div className="font-semibold text-gray-800 text-lg">Set Payment Reminders</div>
                                                        <div className="text-gray-600">Never miss a deadline to avoid penalties</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group bg-gradient-to-r from-green-50/80 to-green-100/80 backdrop-blur-xl border border-green-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                <div className="flex items-start">
                                                    <span className="text-green-500 mr-3 mt-1 text-xl">✓</span>
                                                    <div>
                                                        <div className="font-semibold text-gray-800 text-lg">Build Payment History</div>
                                                        <div className="text-gray-600">Consistent repayments improve your score over time</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="group bg-gradient-to-r from-red-50/80 to-red-100/80 backdrop-blur-xl border border-red-200 rounded-xl p-4 hover:border-red-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                <div className="flex items-start">
                                                    <span className="text-red-500 mr-3 mt-1 text-xl">✗</span>
                                                    <div>
                                                        <div className="font-semibold text-gray-800 text-lg">Avoid Late Payments</div>
                                                        <div className="text-gray-600">Even 1 day late affects your score</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group bg-gradient-to-r from-red-50/80 to-red-100/80 backdrop-blur-xl border border-red-200 rounded-xl p-4 hover:border-red-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                <div className="flex items-start">
                                                    <span className="text-red-500 mr-3 mt-1 text-xl">✗</span>
                                                    <div>
                                                        <div className="font-semibold text-gray-800 text-lg">Don't Ignore Deadlines</div>
                                                        <div className="text-gray-600">Late payments compound over time</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group bg-gradient-to-r from-blue-50/80 to-blue-100/80 backdrop-blur-xl border border-blue-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                                                <div className="flex items-start">
                                                    <span className="text-blue-500 mr-3 mt-1 text-xl">ℹ</span>
                                                    <div>
                                                        <div className="font-semibold text-gray-800 text-lg">Monitor Your Score</div>
                                                        <div className="text-gray-600">Check regularly to track your progress</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Starting Score Info */}
                                <div className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl">
                                            📈
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-700">New User Information</h4>
                                        <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                                    </div>
                                    <div className="bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-xl p-4">
                                        <p className="text-gray-700 leading-relaxed">
                                            New users start with a credit score of <strong className="text-orange-600 text-lg">600</strong>. Your score will change based on your payment behavior. 
                                            The system tracks your total loans, on-time payments, early payments, and late payments to calculate your overall creditworthiness.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditScoreGuide;