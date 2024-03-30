"use client";

import { useState, useEffect } from 'react';

const UsagePage = () => {
  const [usageData, setUsageData] = useState(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch('/usage-data');
        const data = await response.json();
        setUsageData(data);
      } catch (error) {
        console.error('Error fetching usage data:', error);
      }
    };

    fetchUsageData();
  }, []);

  return (
    <div>
      <h1>Usage Data</h1>
      {usageData ? (
        <>
          {JSON.stringify(usageData, null, 2)}
          
        </>
      ) : (
        <p>Loading usage data...</p>
      )}
    </div>
  );
};

export default UsagePage;