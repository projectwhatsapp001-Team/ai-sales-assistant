import Header from "../layout/TopBar";

const ConversationsPage = () => {
    return (
        <div className='flex-1 overflow-auto relative z-10'>
            <main className='max-w-7xl mx-auto py-6 px-4 lg:px-8 h-[calc(100vh-80px)]'>
                <div className='flex h-full bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl border border-gray-700 overflow-hidden'>
                    
                    {/* LEFT SIDE: Contact List (The Leads) */}
                    <div className='w-1/3 border-r border-gray-700 flex flex-col'>
                        <div className='p-4 border-b border-gray-700'>
                            <h2 className='text-lg font-semibold text-gray-100'>Active Leads</h2>
                        </div>
                        <div className='flex-1 overflow-y-auto p-2 space-y-2'>
                            {/* Lead Placeholder 1 */}
                            <div className='p-3 bg-gray-700 bg-opacity-40 rounded-lg border border-green-500/30'>
                                <p className='text-sm font-medium text-white'>John Doe (Luxury Watch Inquiry)</p>
                                <p className='text-xs text-gray-400 truncate'>Betty: "I have checked our inventory..."</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Chat Window */}
<div className='flex-1 flex-col bg-gray-900 bg-opacity-20'>
    {/* Smart Chat Header */}
    <div className='p-4 border-b border-gray-700 bg-gray-800 bg-opacity-30 flex justify-between items-center'>
        <div>
            <p className='text-sm font-semibold text-white'>Conversation with John Doe</p>
            <div className='flex items-center gap-2'>
                <span className='relative flex h-2 w-2'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-green-500'></span>
                </span>
                <span className='text-[10px] text-green-400 uppercase tracking-widest font-bold'>Betty is Handling</span>
            </div>
        </div>

        {/* The Takeover Button */}
        <button className='flex items-center gap-2 bg-gray-700 hover:bg-green-600 text-white text-xs py-2 px-4 rounded-full border border-gray-600 transition-all duration-300 group'>
            <span className='group-hover:hidden'>🤖 Auto Mode</span>
            <span className='hidden group-hover:inline'>🙋 Take Over</span>
        </button>
    </div>

    {/* ... rest of your message and input code stays the same ... */}

                        {/* Message Area */}
                        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
                            {/* Customer Message */}
                            <div className='flex justify-start'>
                                <div className='bg-gray-700 p-3 rounded-2xl rounded-tl-none max-w-md'>
                                    <p className='text-sm text-gray-200'>Do you have the 2026 Gold Chronograph in stock?</p>
                                </div>
                            </div>

                            {/* Betty's Message */}
                            <div className='flex justify-end'>
                                <div className='bg-green-600/20 border border-green-500/30 p-3 rounded-2xl rounded-tr-none max-w-md'>
                                    <p className='text-sm text-white text-right font-light'>
                                        Yes, John. We have one unit remaining in our Lagos boutique. Would you like me to reserve it for you?
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className='p-4 border-t border-gray-700'>
                            <div className='flex gap-2'>
                                <input 
                                    type='text' 
                                    placeholder='Type a message as Betty...' 
                                    className='flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500'
                                />
                                <button className='bg-green-600 text-white px-4 py-2 rounded-lg text-sm'>Send</button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default ConversationsPage;