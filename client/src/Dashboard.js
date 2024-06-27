import React, { useEffect, useState, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ENDPOINT = 'http://localhost:5001';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const chartRef = useRef(null);
  const [metric, setMetric] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on('initialData', (initialData) => {
      console.log('Received initial data:', initialData);
      setData(initialData);
    });

    socket.on('dataUpdated', (newData) => {
      console.log('Received updated data:', newData);
      setData((prevData) => [...prevData, newData]);
    });

    return () => socket.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newEntry = { metric, value: Number(value), timestamp: new Date() };
    try {
      const response = await axios.post(`${ENDPOINT}/api/data`, newEntry);
      console.log('Data successfully added:', response.data);
    } catch (error) {
      console.error('Error adding data:', error);
    }
    setMetric('');
    setValue('');
  };

  const chartData = {
    labels: data.map((d) => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Metric Value',
        data: data.map((d) => d.value),
        fill: false,
        backgroundColor: 'rgba(75,192,192,0.6)',
        borderColor: 'rgba(75,192,192,1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Real-Time Analytics Dashboard',
      },
    },
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [data]);

  return (
    <div style={{ margin: '20px', textAlign: 'center' }}>
      <h2>Real-Time Analytics Dashboard</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Metric" 
          value={metric} 
          onChange={(e) => setMetric(e.target.value)} 
          required 
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <input 
          type="number" 
          placeholder="Value" 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          required 
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button type="submit" style={{ padding: '5px 10px' }}>Add Data</button>
      </form>
      <div style={{ width: '80%', margin: '0 auto' }}>
        <Line ref={chartRef} data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Dashboard;
