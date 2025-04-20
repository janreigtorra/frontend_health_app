import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Using our previously created CSS

function App() {
  const [context, setContext] = useState('');
  const [responseType, setResponseType] = useState(null);
  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(false);
  const [suggestedResponse, setSuggestedResponse] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [error, setError] = useState('');
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Fetch dataset info on component mount
  useEffect(() => {
    const fetchDatasetInfo = async () => {
      try {
        const response = await axios.get('https://backend-health-app.onrender.com/health');
        setDatasetInfo(response.data);
      } catch (error) {
        console.error("Failed to fetch dataset info", error);
      }
    };
    
    fetchDatasetInfo();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setSuggestedResponse('');
    setError('');
    
    try {
      const response = await axios.post('https://backend-health-app.onrender.com/predict', { context });
      setResponseType(response.data.response_type);
      setDistribution(response.data.distribution);
      setError('');
    } catch (error) {
      console.error("Prediction failed", error);
      setError("Failed to analyze the context. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type) => {
    setGenerating(true);
    setSelectedType(type);
    setError('');
    
    try {
      const res = await axios.post('https://backend-health-app.onrender.com/generate', {
        context,
        response_type: type
      });
      setSuggestedResponse(res.data.generated_response);
    } catch (err) {
      console.error("Generation failed", err);
      setError("Failed to generate response. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Response copied to clipboard!");
  };

  // Sort response types by probability
  const sortedResponseTypes = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1]);

  const getColorForPercentage = (percentage) => {
    // Convert percentage to a value between 0 and 1
    const value = percentage / 100;
    
    // Color gradient from blue (low) to green (high)
    if (value > 0.7) return '#34D399'; // Green for high values
    if (value > 0.4) return '#60A5FA'; // Blue for medium values
    return '#9CA3AF'; // Gray for low values
  };

  return (
    <div className="app-container">
      <div className="app-card">
        {/* Header */}
        <div className="app-header">
          <h1>🧠 Counselor Support Assistant</h1>
          <p>AI-powered guidance for mental health professionals</p>
          {datasetInfo && (
            <div className="dataset-badge" onClick={() => setShowInfo(!showInfo)}>
              <span>Training dataset: {datasetInfo.dataset_size} examples</span>
              <span className="info-icon">ℹ️</span>
            </div>
          )}
        </div>
        
        {showInfo && datasetInfo && (
          <div className="info-box">
            <h3>About the Assistant</h3>
            <p>This system uses semantic search to find similar patient contexts from a dataset of {datasetInfo.dataset_size} examples. 
            When generating responses, the assistant identifies the most semantically similar examples from your dataset 
            to provide context-appropriate suggestions.</p>
            <p><strong>How it works:</strong> The system creates vector embeddings of patient contexts and uses cosine similarity to find the most relevant examples. This helps ensure that generated responses are informed by similar past interactions.</p>
            <button className="text-button info-close" onClick={() => setShowInfo(false)}>Close</button>
          </div>
        )}
        
        {/* Main content */}
        <div className="app-content">
          <div className="input-group">
            <label htmlFor="context">Patient Context</label>
            <textarea
              id="context"
              rows="6"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Enter the patient's context or conversation excerpt here..."
            />
          </div>
          
          <div className="button-container">
            <button
              onClick={handleSubmit}
              disabled={loading || !context}
              className={`primary-button ${loading || !context ? 'disabled' : ''}`}
            >
              {loading ? "Analyzing..." : "Analyze Response Options"}
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}
          
          {/* Results Section */}
          {Object.keys(distribution).length > 0 && (
            <div className="results-section">
              <div className="section-header">
                <h2>Response Type Analysis</h2>
                <p>Based on the patient context, here are the recommended response approaches:</p>
              </div>
              
              <div className="response-types-grid">
                {sortedResponseTypes.map(([label, prob]) => {
                  const percentage = (prob * 100).toFixed(1);
                  return (
                    <div key={label} className="response-type-card">
                      <div className="response-type-header">
                        <h3>{label.charAt(0).toUpperCase() + label.slice(1)}</h3>
                        <span className="percentage" style={{ color: getColorForPercentage(parseFloat(percentage)) }}>
                          {percentage}%
                        </span>
                      </div>
                      
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar" 
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: getColorForPercentage(parseFloat(percentage))
                          }}
                        ></div>
                      </div>
                      
                      <button
                        className="secondary-button"
                        onClick={() => handleGenerate(label)}
                        disabled={generating}
                      >
                        {generating && selectedType === label ? 
                          "Finding similar examples..." : 
                          `Generate ${label} response`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Generated Response Section */}
          {suggestedResponse && (
            <div className="suggested-response-section">
              <h2>
                Suggested <span className="highlighted-text">{selectedType}</span> Response
              </h2>
              <div className="semantic-badge">
                Generated using semantically similar examples
              </div>
              <div className="response-content">
                <p>{suggestedResponse}</p>
              </div>
              <div className="response-actions">
                <button 
                  className="text-button"
                  onClick={() => copyToClipboard(suggestedResponse)}
                >
                  Copy to clipboard
                </button>
                <button 
                  className="text-button"
                  onClick={() => setSuggestedResponse('')}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="app-footer">
        <p>Counselor Support Assistant • AI-powered guidance for mental health professionals</p>
      </footer>
    </div>
  );
}

export default App;