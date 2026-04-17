import Header from "../layout/TopBar";

const SettingsPage = () => {
    return (
        <div className='flex-1 overflow-auto relative z-10'>
            <main className='max-w-7xl mx-auto py-6 px-4 lg:px-8'>
                <div className='space-y-6'>
                    
                    {/* Section 1: AI Identity */}
                    <div className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700'>
                        <h2 className='text-xl font-semibold text-green-400 mb-2'>AI Identity & Persona</h2>
                        <p className='text-gray-400 text-sm mb-4'>Define how Betty speaks to your elite clientele.</p>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='p-4 bg-gray-900 rounded-lg border border-gray-700'>
                                <span className='text-gray-300 text-sm'>Response Style</span>
                                <p className='text-xs text-gray-500'>Currently set to: Luxury/Formal</p>
                            </div>
                            <div className='p-4 bg-gray-900 rounded-lg border border-gray-700'>
                                <span className='text-gray-300 text-sm'>Language Support</span>
                                <p className='text-xs text-gray-500'>English, French, Arabic</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Connection Center */}
                    <div className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700'>
                        <h2 className='text-xl font-semibold text-gray-100 mb-2'>System Connectivity</h2>
                        <p className='text-gray-400 text-sm mb-4'>Manage your API integrations and WhatsApp Business link.</p>
                        
                        <button className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
                            Connect WhatsApp Business
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default SettingsPage;