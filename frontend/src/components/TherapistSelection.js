import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/TherapistSelection.css';

function TherapistSelection() {
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${config.apiBaseUrl}/therapists`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.therapists) {
          setTherapists(response.data.therapists);
        }
      } catch (err) {
        console.error('Error fetching therapists:', err);
        setError(err.response?.data?.message || 'Failed to load therapists');
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  const handleSelectTherapist = async (therapist) => {
    try {
      setAssigning(true);
      const token = localStorage.getItem('token');
      
      // First, unassign from current therapist if exists
      const currentTherapist = JSON.parse(localStorage.getItem('selectedTherapist'));
      if (currentTherapist && currentTherapist._id !== therapist._id) {
        try {
          await axios.post(
            `${config.apiBaseUrl}/therapists/${currentTherapist._id}/unassign`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
        } catch (err) {
          console.error('Error unassigning from current therapist:', err);
        }
      }
      
      // Then assign to new therapist
      const response = await axios.post(
        `${config.apiBaseUrl}/therapists/${therapist._id}/assign`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Store therapist info in localStorage
        localStorage.setItem('selectedTherapist', JSON.stringify(therapist));
        setSelectedTherapist(therapist);
        // Navigate to therapist dashboard
        navigate('/therapist-dashboard');
      }
    } catch (err) {
      console.error('Error selecting therapist:', err);
      setError(err.response?.data?.message || 'Failed to select therapist');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <div className="therapist-selection-loading">Loading therapists...</div>;
  }

  if (error) {
    return <div className="therapist-selection-error">{error}</div>;
  }

  return (
    <div className="therapist-selection-container">
      <div className="therapist-selection-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </button>
        <h2>Select Your Therapist</h2>
      </div>
      <div className="therapists-grid">
        {therapists.map((therapist) => (
          <div 
            key={therapist._id} 
            className={`therapist-card ${selectedTherapist?._id === therapist._id ? 'selected' : ''}`}
            onClick={() => handleSelectTherapist(therapist)}
          >
            <div className="therapist-avatar">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="therapist-info">
              <h3>{therapist.firstName} {therapist.lastName}</h3>
              <p className="therapist-username">@{therapist.username}</p>
              <p className="therapist-email">{therapist.email}</p>
            </div>
            <button 
              className={`select-therapist-btn ${selectedTherapist?._id === therapist._id ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectTherapist(therapist);
              }}
              disabled={assigning}
            >
              {assigning && selectedTherapist?._id === therapist._id 
                ? 'Assigning...' 
                : selectedTherapist?._id === therapist._id 
                  ? 'Assigned' 
                  : 'Select'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TherapistSelection; 