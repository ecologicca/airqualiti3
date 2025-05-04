import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/CityDropdown.css';

const CityDropdown = ({ value, onChange }) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      // Get distinct cities from the measurements table
      const { data, error } = await supabase
        .from('measurements')
        .select('city')
        .not('city', 'is', null)
        .distinct();

      if (error) throw error;

      // Sort cities alphabetically
      const sortedCities = data
        .map(item => item.city)
        .sort((a, b) => a.localeCompare(b));

      setCities(sortedCities);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Failed to load cities');
      setLoading(false);
    }
  };

  if (loading) return <div className="city-dropdown-loading">Loading cities...</div>;
  if (error) return <div className="city-dropdown-error">{error}</div>;

  return (
    <div className="city-dropdown-container">
      <label htmlFor="city-select">City</label>
      <select
        id="city-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="city-dropdown"
      >
        <option value="">Select a city</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CityDropdown; 