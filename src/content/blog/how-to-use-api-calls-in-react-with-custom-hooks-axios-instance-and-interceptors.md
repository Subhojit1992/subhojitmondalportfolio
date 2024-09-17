---
title: How to Use API Calls in React with Custom Hooks, Axios Instance, and Interceptors
excerpt: In this article, I'll guide you through setting up a custom hook for API calls using Axios and interceptors in a React project...
publishDate: 'Aug 14 2024'
isFeatured: false
tags:
  - React
seo:
  image:
    src: '/how-to-use-api-calls-in-react-with-custom-hooks-axios-instance-and-interceptors/how-to-use-api-calls-in-react-with-custom-hooks-axios-instance-and-interceptors.webp'
    alt: API Calls in React with Custom Hooks, Axios Instance, and Interceptors
---

![API Calls in React with Custom Hooks, Axios Instance, and Interceptors](/how-to-use-api-calls-in-react-with-custom-hooks-axios-instance-and-interceptors/how-to-use-api-calls-in-react-with-custom-hooks-axios-instance-and-interceptors.webp)

When working with API calls in a React application, it's essential to keep the code clean, reusable, and efficient. A common approach to achieve this is by using custom hooks, along with an Axios instance for handling HTTP requests and interceptors for managing authentication tokens or error handling. In this article, I'll guide you through setting up a custom hook for API calls using Axios and interceptors in a React project.

#### Table of Contents

1. [Introduction to Axios and Custom Hooks](#introduction-to-axios-and-custom-hooks)
2. [Setting Up Axios Instance](#setting-up-axios-instance)
3. [Creating an Axios Interceptor](#creating-an-axios-interceptor)
4. [Building a Custom Hook for API Calls](#building-a-custom-hook-for-api-calls)
5. [Using the Custom Hook in a React Component](#using-the-custom-hook-in-a-react-component)
6. [Upshot](#upshot)

<a id="introduction-to-axios-and-custom-hooks"></a>

### 1. Introduction to Axios and Custom Hooks

**Axios** is a popular JavaScript library used to make HTTP requests from the browser. It provides a simple API for handling HTTP methods like `GET`, `POST`, `PUT`, and `DELETE`. It also supports features like interceptors, which can be used to modify requests or responses before they are handled by `then` or `catch`.

**Custom Hooks** in React are functions that allow you to reuse logic across different components. They start with the prefix `use`, which lets React know that the function follows the rules of hooks.

By combining Axios and custom hooks, you can create a reusable function to make API calls, ensuring that the logic is abstracted away from your components.

<a id="setting-up-axios-instance"></a>

### 2. Setting Up Axios Instance

The first step is to set up an Axios instance. This instance will be used throughout the application to make API requests.

```javascript
// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com', // Replace with your API's base URL
  timeout: 10000, // Set a timeout for requests
  headers: {
    'Content-Type': 'application/json'
  }
});

export default axiosInstance;
```

<a id="creating-an-axios-interceptor"></a>

### 3. Creating an Axios Interceptor

Next, we'll create an interceptor to attach tokens to requests or handle errors globally.

```javascript
// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com', // Replace with your API's base URL
  timeout: 10000, // Set a timeout for requests
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Get the token from localStorage or any other storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach the token to the Authorization header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
      console.error('Unauthorized, redirecting to login...');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

<a id="building-a-custom-hook-for-api-calls"></a>

### 4. Building a Custom Hook for API Calls

Now, let's create a custom hook called `useApi` that uses the Axios instance to make API calls.

```javascript
// src/hooks/useApi.js
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const useApi = (endpoint, method = 'GET', body = null, dependencies = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance({
          url: endpoint,
          method: method,
          data: body
        });
        setData(response.data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies); // Re-run the effect if dependencies change

  return { data, error, loading };
};

export default useApi;
```

<a id="using-the-custom-hook-in-a-react-component"></a>

### 5. Using the Custom Hook in a React Component

Finally, let's see how to use this custom hook in a React component.

```javascript
// src/components/ExampleComponent.js
import React from 'react';
import useApi from '../hooks/useApi';

const ExampleComponent = () => {
  const { data, error, loading } = useApi('/users', 'GET', null, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>User List</h1>
      <ul>
        {data.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ExampleComponent;
```

<a id="upshot"></a>

### 6. Upshot

By setting up an Axios instance, creating interceptors, and using custom hooks, you can effectively manage API calls in your React applications. This approach not only keeps your code organized and reusable but also simplifies the handling of common tasks like authentication and error management.

The example provided is just a starting point. You can further extend the custom hook to handle other scenarios such as pagination, query parameters, or even caching.

Feel free to adapt this code to fit the specific needs of your application, and happy coding!
