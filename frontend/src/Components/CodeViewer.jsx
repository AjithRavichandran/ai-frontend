import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function CodeViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the generated code from localStorage using the ID from URL params
    if (id) {
      const storedCode = localStorage.getItem(`generation_${id}`);
      if (storedCode) {
        setCode(storedCode);
      } else {
        setError('Code not found. It may have expired or been deleted.');
      }
      setLoading(false);
    }
  }, [id]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    // You could add a toast notification here
  };

  const goBack = () => {
    navigate(-1); // Navigate back to previous page
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-800">
      <div className="bg-gray-900 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Generated Code</h1>
          <div className="space-x-3">
            <button
              onClick={goBack}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back to Generator
            </button>
            <button 
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={!code}
            >
              Copy Code
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-300">Loading code...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-600 bg-opacity-25 border border-red-700 text-red-200 rounded-lg text-center">
            <h3 className="text-xl font-medium mb-2">Error</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center">
              <span className="text-gray-300 font-mono text-sm">Generation #{id}</span>
              <button 
                onClick={copyToClipboard}
                className="p-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
              >
                Copy
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(100vh-12rem)]">
              <pre className="text-green-400 whitespace-pre-wrap font-mono text-sm">
                {code}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}