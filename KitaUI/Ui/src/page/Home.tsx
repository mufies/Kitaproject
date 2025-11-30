import Navigator from '../components/navigator';

export default function Home() {
    return (
        <>
            <Navigator />
            <div className="max-h-screen max-w-screen bg-black text-white">
                <main className=" px-4 sm:px-6 lg:px-8 py-8">
                    {/* <h2 className="text-3xl font-bold mb-6">Welcome Home</h2>
                    <p className="text-gray-400">Select an option from the navigation bar.</p> */}
                </main>
            </div>
        </>
    );
}
