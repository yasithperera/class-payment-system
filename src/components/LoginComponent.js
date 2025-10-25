const LoginComponent = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Import your users service
      // Make sure to add the usersService to your services.js file
      const { usersService } = await import('./firebase/services.js');
      
      // Verify login credentials using the service
      const user = await usersService.verifyLogin(username, password);
      
      if (user) {
        // Login successful
        onLoginSuccess(user);
      } else {
        setError('Invalid username or password');
      }

    } catch (err) {
      console.error('Login error:', err);
      
      // Provide more specific error messages
      if (err.message.includes('Firebase')) {
        setError('Firebase connection error. Please check your configuration.');
      } else if (err.message.includes('services')) {
        setError('Services not found. Please ensure usersService is exported from services.js');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Class Payment</h1>
          <p className="text-gray-600 mt-2">Management System</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <div className="space-y-6">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-gray-400" size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-700 font-semibold mb-2">📝 Setup Instructions:</p>
          <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
            <li>Add <code className="bg-gray-200 px-1 rounded">usersService</code> to your <code className="bg-gray-200 px-1 rounded">services.js</code> file (see comment in code)</li>
            <li>Create 'users' collection in Firestore</li>
            <li>Add user documents with fields:
              <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                <li>username (string)</li>
                <li>password (string)</li>
                <li>name (string)</li>
                <li>email (string, optional)</li>
              </ul>
            </li>
          </ol>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600 font-semibold mb-1">Example User Document:</p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`{
  username: "admin",
  password: "admin123",
  name: "Administrator",
  email: "admin@example.com"
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
