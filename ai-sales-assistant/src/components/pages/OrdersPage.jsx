import Header from "../layout/TopBar";

const OrdersPage = () => {
    const orders = [
        { id: "ORD001", customer: "John Doe", product: "Gold Chronograph", amount: "$12,500", status: "Processing", date: "2026-04-17" },
        { id: "ORD002", customer: "Sarah Smith", product: "Diamond Pendant", amount: "$8,200", status: "Delivered", date: "2026-04-16" },
        { id: "ORD003", customer: "Michael Chen", product: "Silver Cufflinks", amount: "$450", status: "Shipped", date: "2026-04-15" },
    ];

    return (
        <div className='flex-1 overflow-auto relative z-10'>
            <main className='max-w-7xl mx-auto py-6 px-4 lg:px-8'>
                <div className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700'>
                    <div className='flex justify-between items-center mb-6'>
                        <h2 className='text-xl font-semibold text-gray-100'>Sales Ledger</h2>
                        <button className='bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-4 rounded-lg'>
                            Export Report
                        </button>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='min-w-full divide-y divide-gray-700'>
                            <thead>
                                <tr>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-widest'>Order ID</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-widest'>Customer</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-widest'>Product</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-widest'>Amount</th>
                                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-widest'>Status</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-700'>
                                {orders.map((order) => (
                                    <tr key={order.id} className='hover:bg-gray-700/30 transition-colors'>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-green-400'>{order.id}</td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-200'>{order.customer}</td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-300'>{order.product}</td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold text-white'>{order.amount}</td>
                                        <td className='px-6 py-4 whitespace-nowrap'>
                                            <span className={`px-2 py-1 text-[10px] rounded-full ${
                                                order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrdersPage;