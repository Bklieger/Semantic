"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Area } from 'recharts';

const UsagePage = () => {
  const [usageData, setUsageData] = useState(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch('/api/usage-data');
        const data = await response.json();
        setUsageData(data.usage_data);
      } catch (error) {
        console.error('Error fetching usage data:', error);
      }
    };

    fetchUsageData();
  }, []);

  const dataFormatter = (number) => {
    return Intl.NumberFormat("us").format(number).toString();
  };

  return (
    <div style={{ margin: "10%" }}>
      <h1
        className="relative md:ml-[-10px] md:mb-[35px] font-bold text-[8vw] md:text-[35px] font-inter text-[#1E2B3A] leading-[1.1] tracking-[-2px] z-[100]"
        style={{ textAlign: 'center' }}
      >
        Usage Analytics (# of API Calls)<br />
      </h1>
      {usageData ? (
        <div style={{ width: "80vw", height: "40vh" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={usageData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
            
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date_hour" tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis label={{ value: '# of API Calls', angle: -90, position: 'insideLeft', dy: 30, textAnchor: 'middle' }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
              <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p>Loading usage data...</p>
      )}
    </div>
  );
};

export default UsagePage;