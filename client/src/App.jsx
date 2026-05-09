import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import './App.css'; // You can add basic styles here

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [curriculum, setCurriculum] = useState(null);
  const [activeIds, setActiveIds] = useState({ conceptId: null, subconceptId: null });
  const [activeTab, setActiveTab] = useState('theory');
  const [content, setContent] = useState(null);

  // 1. Fetch Curriculum on Load
  useEffect(() => {
    axios.get(`${API_BASE}/curriculum`).then((res) => {
      setCurriculum(res.data);
      // Set initial active subconcept
      if (res.data.concepts.length > 0 && res.data.concepts[0].subconcepts.length > 0) {
        setActiveIds({
          conceptId: res.data.concepts[0]._id,
          subconceptId: res.data.concepts[0].subconcepts[0]._id
        });
      }
    });
  }, []);

  // 2. Fetch Content when Subconcept changes
  useEffect(() => {
    if (activeIds.conceptId && activeIds.subconceptId) {
      setContent(null); // Clear old content while loading
      axios.get(`${API_BASE}/content/${activeIds.conceptId}/${activeIds.subconceptId}`)
        .then(res => setContent(res.data));
    }
  }, [activeIds]);

  if (!curriculum) return <div style={{ padding: '2rem' }}>Loading Curriculum...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '300px', borderRight: '1px solid #ccc', overflowY: 'auto', padding: '1rem', background: '#f8f9fa' }}>
        <h3>{curriculum.title}</h3>
        {curriculum.concepts.map(concept => (
          <div key={concept._id} style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0.5rem 0' }}>{concept.title}</h4>
            <ul style={{ listStyleType: 'none', paddingLeft: '1rem', margin: 0 }}>
              {concept.subconcepts.map(sub => (
                <li 
                  key={sub._id} 
                  onClick={() => {
                    setActiveIds({ conceptId: concept._id, subconceptId: sub._id });
                    setActiveTab('theory');
                  }}
                  style={{ 
                    padding: '0.5rem', 
                    cursor: 'pointer', 
                    background: activeIds.subconceptId === sub._id ? '#e0f2fe' : 'transparent',
                    borderRadius: '4px'
                  }}
                >
                  {sub.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem', overflowY: 'auto' }}>
        
        {/* TABS */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem', marginBottom: '2rem' }}>
          {['theory', 'scq', 'mcq', 'saq'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                background: activeTab === tab ? '#0284c7' : '#e2e8f0',
                color: activeTab === tab ? 'white' : 'black',
                cursor: 'pointer',
                borderRadius: '4px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENT DISPLAY */}
        {!content ? <p>Loading Content...</p> : (
          <div>
            {activeTab === 'theory' && (
              <div>
                {content.theory.map((paragraph, idx) => (
                  <ReactMarkdown 
                    key={idx} 
                    remarkPlugins={[remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {paragraph}
                  </ReactMarkdown>
                ))}
              </div>
            )}

            {(activeTab === 'scq' || activeTab === 'mcq') && (
              <div>
                {content[activeTab]?.length === 0 ? <p>No questions available.</p> : null}
                {content[activeTab]?.map(q => (
                  <QuizQuestion 
                    key={q._id} 
                    questionData={q} 
                    type={activeTab} 
                    ids={{ ...activeIds, questionId: q._id }} 
                  />
                ))}
              </div>
            )}

            {activeTab === 'saq' && (
              <div>
                {content.saq?.length === 0 ? <p>No questions available.</p> : null}
                {content.saq?.map(q => (
                  <div key={q._id} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
                    <strong>Q: {q.question}</strong>
                    <details style={{ marginTop: '1rem' }}>
                      <summary style={{ cursor: 'pointer', color: '#0284c7' }}>View Sample Answer</summary>
                      <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '4px' }}>
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {q.sample_answer}
                        </ReactMarkdown>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Child Component for SCQ/MCQ Interactions
function QuizQuestion({ questionData, type, ids }) {
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  // Reset state if question changes
  useEffect(() => {
    setSelected([]);
    setResult(null);
  }, [questionData._id]);

  const handleToggle = (optionId) => {
    if (result) return; // Don't allow changes after submission
    if (type === 'scq') {
      setSelected([optionId]);
    } else {
      setSelected(prev => prev.includes(optionId) 
        ? prev.filter(id => id !== optionId) 
        : [...prev, optionId]
      );
    }
  };

  const checkAnswer = async () => {
    if (selected.length === 0) return;
    
    const res = await axios.post(`${API_BASE}/evaluate`, {
      conceptId: ids.conceptId,
      subconceptId: ids.subconceptId,
      questionType: type,
      questionId: ids.questionId,
      selectedOptionIds: selected
    });
    
    setResult(res.data);
  };

  return (
    <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
      <p style={{ fontWeight: 'bold' }}>{questionData.question}</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0' }}>
        {questionData.options.map(opt => {
          let bgColor = 'white';
          if (result) {
            if (result.correctOptionIds.includes(opt._id)) bgColor = '#dcfce7'; // Green if correct
            else if (selected.includes(opt._id)) bgColor = '#fee2e2'; // Red if wrong selection
          }

          return (
            <label 
              key={opt._id} 
              style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: bgColor }}
            >
              <input 
                type={type === 'scq' ? 'radio' : 'checkbox'} 
                checked={selected.includes(opt._id)}
                onChange={() => handleToggle(opt._id)}
                disabled={result !== null}
                style={{ marginRight: '10px' }}
              />
              <ReactMarkdown components={{p: 'span'}} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {opt.text}
              </ReactMarkdown>
            </label>
          )
        })}
      </div>

      {!result ? (
        <button 
          onClick={checkAnswer}
          style={{ padding: '0.5rem 1rem', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Check Answer
        </button>
      ) : (
        <div style={{ marginTop: '1rem', padding: '1rem', background: result.isCorrect ? '#dcfce7' : '#fee2e2', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: result.isCorrect ? '#166534' : '#991b1b' }}>
            {result.isCorrect ? 'Correct!' : 'Incorrect'}
          </h4>
          <p style={{ margin: 0 }}>{result.explanation}</p>
        </div>
      )}
    </div>
  );
}
